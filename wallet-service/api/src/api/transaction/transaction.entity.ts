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

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  TRANSFER = 'TRANSFER',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}
@Entity('transactions')
@Index(['reference'], { unique: true })
@Index(['from_wallet_id', 'created_at'])
@Index(['to_wallet_id', 'created_at'])
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  type: TransactionType;

  @Column({ type: 'varchar' })
  status: TransactionStatus;

  @Column()
  reference: string;

  @Column({ type: 'bigint' })
  amount: string;

  @ManyToOne(() => WalletEntity, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'from_wallet_id' })
  from_wallet?: WalletEntity;

  @Column({ nullable: true })
  from_wallet_id?: string;

  @ManyToOne(() => WalletEntity, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'to_wallet_id' })
  to_wallet?: WalletEntity;

  @Column({ nullable: true })
  to_wallet_id?: string;

  @CreateDateColumn()
  created_at: Date;
}
