import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateUserTable1776185917276 implements MigrationInterface {
  name = 'UpdateUserTable1776185917276';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "password" character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "password"`);
  }
}
