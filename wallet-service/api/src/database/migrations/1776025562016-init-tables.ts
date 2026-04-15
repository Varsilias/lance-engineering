import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitTables1776025562016 implements MigrationInterface {
  name = 'InitTables1776025562016';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "first_name" character varying NOT NULL, "last_name" character varying, "middle_name" character varying, "email" character varying, "email_verified_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "wallets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "REL_92558c08091598f7a4439586cd" UNIQUE ("user_id"), CONSTRAINT "PK_8402e5df5a30a229380e83e4f7e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_92558c08091598f7a4439586cd" ON "wallets" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "ledger_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "wallet_id" uuid NOT NULL, "type" character varying NOT NULL, "amount" bigint NOT NULL, "reference" character varying NOT NULL, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6efcb84411d3f08b08450ae75d5" PRIMARY KEY ("id")); COMMENT ON COLUMN "ledger_entries"."amount" IS 'amount stored in kobo'; COMMENT ON COLUMN "ledger_entries"."reference" IS 'idempotency / traceability key'`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_e65825ccc890b273369f21ec2f" ON "ledger_entries" ("reference") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_ac345606110663f9a904028e63" ON "ledger_entries" ("wallet_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_bb5cd6d7046b98d8faabe9c18f" ON "ledger_entries" ("wallet_id") `,
    );
    await queryRunner.query(
      `CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying NOT NULL, "status" character varying NOT NULL, "reference" character varying NOT NULL, "amount" bigint NOT NULL, "from_wallet_id" uuid, "to_wallet_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_232ac97a23e06533e578e04151" ON "transactions" ("to_wallet_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_f479031c517e46201b70da977b" ON "transactions" ("from_wallet_id", "created_at") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_dd85cc865e0c3d5d4be095d3f3" ON "transactions" ("reference") `,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD CONSTRAINT "FK_92558c08091598f7a4439586cda" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ledger_entries" ADD CONSTRAINT "FK_bb5cd6d7046b98d8faabe9c18fe" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_c337cc8fd8b43b3e8414f6464ec" FOREIGN KEY ("from_wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" ADD CONSTRAINT "FK_0ead82990d0099eecec1fa10a29" FOREIGN KEY ("to_wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_0ead82990d0099eecec1fa10a29"`,
    );
    await queryRunner.query(
      `ALTER TABLE "transactions" DROP CONSTRAINT "FK_c337cc8fd8b43b3e8414f6464ec"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ledger_entries" DROP CONSTRAINT "FK_bb5cd6d7046b98d8faabe9c18fe"`,
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP CONSTRAINT "FK_92558c08091598f7a4439586cda"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dd85cc865e0c3d5d4be095d3f3"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_f479031c517e46201b70da977b"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_232ac97a23e06533e578e04151"`,
    );
    await queryRunner.query(`DROP TABLE "transactions"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_bb5cd6d7046b98d8faabe9c18f"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_ac345606110663f9a904028e63"`,
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e65825ccc890b273369f21ec2f"`,
    );
    await queryRunner.query(`DROP TABLE "ledger_entries"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_92558c08091598f7a4439586cd"`,
    );
    await queryRunner.query(`DROP TABLE "wallets"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
