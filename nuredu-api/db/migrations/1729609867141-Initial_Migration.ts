import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1729609867141 implements MigrationInterface {
    name = 'InitialMigration1729609867141'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "course" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "course" ADD "description" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "course" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "course" ADD "description" integer NOT NULL`);
    }

}
