import { BadRequestException, Injectable } from '@nestjs/common';
import {
  DepositFundDto,
  TransactionQueryDto,
  TransferFundDto,
} from './wallet.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { WalletEntity } from './wallet.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import {
  TransactionEntity,
  TransactionStatus,
  TransactionType,
} from '../transaction/transaction.entity';
import { LedgerEntryEntity, LedgerEntryType } from '../ledger/ledger.entity';
import { ResponseDto } from '../../commons/utils/response.dto';
import { IDecoratorUser } from '../../commons/decorators/current-admin.decorator';
import { UserEntity } from '../user/user.entity';

@Injectable()
export class WalletService {
  constructor(
    private readonly ds: DataSource,

    @InjectRepository(WalletEntity)
    private readonly walletRepository: Repository<WalletEntity>,

    @InjectRepository(LedgerEntryEntity)
    private readonly ledgerRepository: Repository<LedgerEntryEntity>,

    @InjectRepository(TransactionEntity)
    private readonly trxRepository: Repository<TransactionEntity>,

    @InjectRepository(UserEntity)
    private readonly userRespository: Repository<UserEntity>,
  ) {}

  async fundWallet(dto: DepositFundDto, authUser: IDecoratorUser) {
    // we can then pull user data by calling
    const user = await this.userRespository.findOne({
      where: { id: authUser.sub },
      relations: ['wallet'],
    });
    const { amount, reference: clientRef } = dto;

    if (!user || !user.wallet) {
      throw new BadRequestException('Invalid account provided');
    }

    return await this.ds.transaction(async (manager) => {
      const amountInKobo = Math.round(Number(amount) * 100);
      const reference = clientRef ?? crypto.randomUUID();

      let tx: TransactionEntity;

      try {
        tx = manager.create(TransactionEntity, {
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.PENDING,
          amount: amountInKobo.toString(),
          to_wallet_id: user.wallet.id,
          reference,
        });

        await manager.save(tx);
      } catch (error: any) {
        // Postgres unique violation
        if (error.code === '23505') {
          const existing = await this.trxRepository.findOne({
            where: { reference },
          });

          if (existing) {
            return ResponseDto.success('Wallet funded successfully', existing);
          }
        }

        throw error;
      }

      await manager.save(
        manager.create(LedgerEntryEntity, {
          wallet: user.wallet,
          type: LedgerEntryType.CREDIT,
          amount: amountInKobo.toString(),
          reference: tx.reference,
          transaction: tx,
        }),
      );

      tx.status = TransactionStatus.SUCCESS;
      await manager.save(tx);
      return ResponseDto.success('Wallet funded successfully', tx);
    });
  }

  async getTransactionHistory(
    user_id: string,
    query: TransactionQueryDto,
    authUser: IDecoratorUser,
  ) {
    const { limit = 20, cursor } = query;

    const wallet = await this.walletRepository.findOne({
      where: { user_id: authUser.sub },
    });

    if (!wallet) {
      throw new BadRequestException('Invalid account provided');
    }

    const qb = this.trxRepository
      .createQueryBuilder('t')
      .where('t.from_wallet_id = :walletId OR t.to_wallet_id = :walletId', {
        walletId: wallet.id,
      })
      .orderBy('t.created_at', 'DESC')
      .limit(limit + 1); // fetch one extra for next cursor

    if (cursor) {
      qb.andWhere('t.created_at < :cursor', { cursor });
    }

    const transactions = await qb.getMany();

    const hasNext = transactions.length > limit;

    const data = hasNext ? transactions.slice(0, limit) : transactions;

    const nextCursor = hasNext ? data[data.length - 1].created_at : null;

    return ResponseDto.success('Transaction history fetched', {
      items: data.map((trx) => ({
        ...trx,
        amount: Math.round(Number(trx.amount) / 100),
      })),
      next_cursor: nextCursor,
      has_next: hasNext,
    });
  }

  async getBalance(user_id: string) {
    const wallet = await this.walletRepository.findOne({
      where: { user_id },
    });

    if (!wallet) {
      throw new BadRequestException('Invalid account provided');
    }

    const result = await this.ledgerRepository
      .createQueryBuilder('l')
      .select(
        `
      COALESCE(SUM(
        CASE 
          WHEN l.type = 'CREDIT' THEN l.amount::bigint
          ELSE -l.amount::bigint
        END
      ), 0)
    `,
        'balance',
      )
      .where('l.wallet_id = :walletId', { walletId: wallet.id })
      .getRawOne();

    const balance = result.balance ?? '0';

    return ResponseDto.success('Wallet balance fetched', {
      balance_kobo: Number(balance),
      balance_naira: Number(balance) / 100,
    });
  }

  async transferMoney(
    transferFundDto: TransferFundDto,
    currentUser: IDecoratorUser,
  ) {
    const {
      // from_account_id,
      to_account_id,
      amount,
      reference: clientRef,
    } = transferFundDto;

    return this.ds.transaction(async (manager) => {
      const user = await manager.findOne(UserEntity, {
        where: { id: currentUser.sub },
        relations: ['wallet'],
      });
      if (!user) {
        throw new BadRequestException('Invalid from account provided');
      }
      // const fromWallet = await manager.findOne(WalletEntity, {
      //   where: { id: user.sub },
      // });
      // if (!fromWallet) {
      //   throw new BadRequestException('Invalid from account provided');
      // }

      const fromWallet = user.wallet;

      if (!fromWallet) {
        throw new BadRequestException('Invalid from account provided');
      }

      const toWallet = await manager.findOne(WalletEntity, {
        where: { id: to_account_id },
      });
      if (!toWallet) {
        throw new BadRequestException('Invalid to account provided');
      }

      if (fromWallet.id === toWallet.id) {
        throw new BadRequestException('You cannot transfer to yourself');
      }

      const amountInKobo = Math.round(Number(amount) * 100);

      // lock ordering provides deadlock safety for concurrent transactions on same pair
      const [first, second] =
        fromWallet.id < toWallet.id
          ? [fromWallet.id, toWallet.id]
          : [toWallet.id, fromWallet.id];

      await manager.findOne(WalletEntity, {
        where: { id: first },
        lock: { mode: 'pessimistic_write' },
      });

      await manager.findOne(WalletEntity, {
        where: { id: second },
        lock: { mode: 'pessimistic_write' },
      });

      const balance = await this._getBalance(fromWallet.id, manager);

      if (balance < amountInKobo) {
        throw new BadRequestException('Insufficient funds');
      }

      let tx: TransactionEntity;

      try {
        tx = manager.create(TransactionEntity, {
          type: TransactionType.TRANSFER,
          status: TransactionStatus.PENDING,
          amount: amountInKobo.toString(),
          from_wallet_id: fromWallet.id,
          to_wallet_id: toWallet.id,
          reference: clientRef,
        });

        await manager.save(tx);
      } catch (error: any) {
        if (error.code === '23505') {
          const existing = await this.trxRepository.findOne({
            where: { reference: clientRef },
          });

          return ResponseDto.success('Transfer successful', existing);
        }
        throw error;
      }

      await manager.save(
        manager.create(LedgerEntryEntity, {
          wallet_id: fromWallet.id,
          type: LedgerEntryType.DEBIT,
          amount: amountInKobo.toString(),
          reference: clientRef,
          transaction: tx,
        }),
      );

      await manager.save(
        manager.create(LedgerEntryEntity, {
          wallet_id: toWallet.id,
          type: LedgerEntryType.CREDIT,
          amount: amountInKobo.toString(),
          reference: clientRef,
          transaction: tx,
        }),
      );

      tx.status = TransactionStatus.SUCCESS;
      await manager.save(tx);

      return ResponseDto.success('Transfer successful', tx);
    });
  }

  async getWallets(currentUser: IDecoratorUser) {
    const wallets = await this.walletRepository
      .createQueryBuilder('wallet')
      .leftJoin('wallet.user', 'user')
      .select([
        'wallet.id',
        'wallet.user_id',
        'wallet.created_at',
        'user.first_name',
        'user.last_name',
      ])
      .where('user.id != :user_id', { user_id: currentUser.sub })
      .orderBy('wallet.created_at', 'DESC')
      .getRawMany();

    return ResponseDto.success(
      'Wallets fetched successuflly',
      wallets.map((w) => ({
        id: w.wallet_id,
        user_id: w.wallet_user_id,
        first_name: w.user_first_name,
        last_name: w.user_last_name,
        created_at: w.wallet_created_at,
      })),
    );
  }

  private async _getBalance(walletId: string, manager: EntityManager) {
    const result = await manager
      .createQueryBuilder(LedgerEntryEntity, 'l')
      .select(
        `
      COALESCE(SUM(
        CASE 
          WHEN l.type = 'CREDIT' THEN l.amount::bigint
          ELSE -l.amount::bigint
        END
      ), 0)
    `,
        'balance',
      )
      .where('l.wallet_id = :walletId', { walletId })
      .getRawOne();

    return Number(result.balance);
  }
}
