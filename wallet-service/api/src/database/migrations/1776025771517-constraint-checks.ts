import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConstraintChecks1776025771517 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE ledger_entries ADD CONSTRAINT chk_ledger_amount_positive CHECK (amount::bigint > 0);`,
    );

    await queryRunner.query(
      `ALTER TABLE transactions ADD CONSTRAINT chk_transaction_amount_positive CHECK (amount::bigint > 0);`,
    );

    await queryRunner.query(
      `ALTER TABLE transactions ADD CONSTRAINT chk_no_self_transfer CHECK (from_wallet_id IS NULL OR to_wallet_id IS NULL OR from_wallet_id != to_wallet_id);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE transactions DROP CONSTRAINT IF EXISTS chk_no_self_transfer;`,
    );

    await queryRunner.query(
      `ALTER TABLE transactions DROP CONSTRAINT IF EXISTS chk_transaction_amount_positive;`,
    );

    await queryRunner.query(
      `ALTER TABLE ledger_entries DROP CONSTRAINT IF EXISTS chk_ledger_amount_positive;`,
    );
  }
}
