import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletEntity } from './wallet.entity';
import { WalletController } from './wallet.controller';
import { LedgerEntryEntity } from '../ledger/ledger.entity';
import { TransactionEntity } from '../transaction/transaction.entity';
import { UserEntity } from '../user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WalletEntity,
      LedgerEntryEntity,
      TransactionEntity,
      UserEntity,
    ]),
  ],
  providers: [WalletService],
  controllers: [WalletController],
})
export class WalletModule {}
