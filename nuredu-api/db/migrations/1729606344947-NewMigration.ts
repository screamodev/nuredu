import { MigrationInterface, QueryRunner } from "typeorm";

export class NewMigration1729606344947 implements MigrationInterface {
    name = 'NewMigration1729606344947'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "role" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, CONSTRAINT "UQ_ae4578dcaed5adff96595e61660" UNIQUE ("name"), CONSTRAINT "PK_b36bcfe02fc8de3c57a8b2391c2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "material" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "content" character varying NOT NULL, "courseId" integer, CONSTRAINT "PK_0343d0d577f3effc2054cbaca7f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "course" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "description" integer NOT NULL, "teacherId" integer, CONSTRAINT "PK_bf95180dd756fd204fb01ce4916" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "username" character varying NOT NULL, "password" character varying NOT NULL, CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user_courses_course" ("userId" integer NOT NULL, "courseId" integer NOT NULL, CONSTRAINT "PK_c0795b2733bf088882aa84663cd" PRIMARY KEY ("userId", "courseId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e99d8f99eff1a45a772b11060e" ON "user_courses_course" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_d67262674f71493825eb35e2e2" ON "user_courses_course" ("courseId") `);
        await queryRunner.query(`CREATE TABLE "user_role_role" ("userId" integer NOT NULL, "roleId" integer NOT NULL, CONSTRAINT "PK_8f1a6e129f057889ccddcb4b533" PRIMARY KEY ("userId", "roleId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_26736dfb41d6a47ce5d8365aad" ON "user_role_role" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_8188039e9fdf7572245e2ed8a8" ON "user_role_role" ("roleId") `);
        await queryRunner.query(`ALTER TABLE "material" ADD CONSTRAINT "FK_8fe92cba47c804636fc2f55677b" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "course" ADD CONSTRAINT "FK_3e002f760e8099dd5796e5dc93b" FOREIGN KEY ("teacherId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "FK_e99d8f99eff1a45a772b11060e5" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" ADD CONSTRAINT "FK_d67262674f71493825eb35e2e2c" FOREIGN KEY ("courseId") REFERENCES "course"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_role_role" ADD CONSTRAINT "FK_26736dfb41d6a47ce5d8365aad7" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_role_role" ADD CONSTRAINT "FK_8188039e9fdf7572245e2ed8a83" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_role_role" DROP CONSTRAINT "FK_8188039e9fdf7572245e2ed8a83"`);
        await queryRunner.query(`ALTER TABLE "user_role_role" DROP CONSTRAINT "FK_26736dfb41d6a47ce5d8365aad7"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "FK_d67262674f71493825eb35e2e2c"`);
        await queryRunner.query(`ALTER TABLE "user_courses_course" DROP CONSTRAINT "FK_e99d8f99eff1a45a772b11060e5"`);
        await queryRunner.query(`ALTER TABLE "course" DROP CONSTRAINT "FK_3e002f760e8099dd5796e5dc93b"`);
        await queryRunner.query(`ALTER TABLE "material" DROP CONSTRAINT "FK_8fe92cba47c804636fc2f55677b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8188039e9fdf7572245e2ed8a8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_26736dfb41d6a47ce5d8365aad"`);
        await queryRunner.query(`DROP TABLE "user_role_role"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d67262674f71493825eb35e2e2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e99d8f99eff1a45a772b11060e"`);
        await queryRunner.query(`DROP TABLE "user_courses_course"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "course"`);
        await queryRunner.query(`DROP TABLE "material"`);
        await queryRunner.query(`DROP TABLE "role"`);
    }

}
