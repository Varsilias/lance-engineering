import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateLedgerTable1776082722062 implements MigrationInterface {
  name = 'UpdateLedgerTable1776082722062';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e65825ccc890b273369f21ec2f"`,
    );

    await queryRunner.query(
      `ALTER TABLE "ledger_entries" ADD "transaction_id" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e65825ccc890b273369f21ec2f" ON "ledger_entries" ("reference") `,
    );
    await queryRunner.query(
      `ALTER TABLE "ledger_entries" ADD CONSTRAINT "FK_b26c5ef5853fd6e0a8680427f60" FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ledger_entries" DROP CONSTRAINT "FK_b26c5ef5853fd6e0a8680427f60"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e65825ccc890b273369f21ec2f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ledger_entries" DROP COLUMN "transaction_id"`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e65825ccc890b273369f21ec2f" ON "ledger_entries" ("reference") `,
    );
  }
}
