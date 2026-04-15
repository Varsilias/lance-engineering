import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WalletEntity } from '../wallet/wallet.entity';
import { TransactionEntity } from '../transaction/transaction.entity';

export enum LedgerEntryType {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

@Entity('ledger_entries')
@Index(['wallet_id'])
@Index(['wallet_id', 'created_at'])
@Index(['reference']) // idempotency
export class LedgerEntryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  wallet_id: string;

  @ManyToOne(() => WalletEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'wallet_id' })
  wallet: WalletEntity;

  @Column()
  transaction_id: string;

  @ManyToOne(() => TransactionEntity, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'transaction_id' })
  transaction: TransactionEntity;

  // I prefer to use string here and instead put a constraint on the value via Types. Dealing with Enum types in Postgres can be messy
  // especially when running migrations
  @Column({ type: 'varchar' })
  type: LedgerEntryType;

  @Column({ type: 'bigint', comment: 'amount stored in kobo' })
  amount: string;

  @Column({ comment: 'idempotency / traceability key' })
  reference: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn()
  created_at: Date;
}
