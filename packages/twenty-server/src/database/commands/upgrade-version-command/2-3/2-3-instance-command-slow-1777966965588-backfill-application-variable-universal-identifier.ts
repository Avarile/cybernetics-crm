import { DataSource, QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { SlowInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/slow-instance-command.interface';

@RegisteredInstanceCommand('2.3.0', 1777966965588, { type: 'slow' })
export class BackfillApplicationVariableUniversalIdentifierSlowInstanceCommand implements SlowInstanceCommand {
  async runDataMigration(dataSource: DataSource): Promise<void> {
    // applicationId was never backfilled for pre-existing rows, so any row still NULL
    // here has no owning application and is deleted rather than backfilled.
    await dataSource.query(
      'DELETE FROM "core"."applicationVariable" WHERE "applicationId" IS NULL',
    );
    // Random, not derived: unlike object/field metadata, application variables have no
    // other stable natural key to deterministically derive a universalIdentifier from.
    await dataSource.query(
      'UPDATE "core"."applicationVariable" SET "universalIdentifier" = gen_random_uuid() WHERE "universalIdentifier" IS NULL',
    );
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'ALTER TABLE "core"."applicationVariable" DROP CONSTRAINT "FK_51adb49e7f8df35dd23e01c4830"',
    );
    await queryRunner.query(
      'ALTER TABLE "core"."applicationVariable" ALTER COLUMN "applicationId" SET NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "core"."applicationVariable" ADD CONSTRAINT "FK_51adb49e7f8df35dd23e01c4830" FOREIGN KEY ("applicationId") REFERENCES "core"."application"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
    );
    await queryRunner.query(
      'ALTER TABLE "core"."applicationVariable" ALTER COLUMN "universalIdentifier" SET NOT NULL',
    );
    await queryRunner.query(
      'CREATE UNIQUE INDEX "IDX_44ecebdf70cbed17f89527b36b" ON "core"."applicationVariable" ("workspaceId", "universalIdentifier") ',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX "core"."IDX_44ecebdf70cbed17f89527b36b"',
    );
    await queryRunner.query(
      'ALTER TABLE "core"."applicationVariable" ALTER COLUMN "universalIdentifier" DROP NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "core"."applicationVariable" DROP CONSTRAINT "FK_51adb49e7f8df35dd23e01c4830"',
    );
    await queryRunner.query(
      'ALTER TABLE "core"."applicationVariable" ALTER COLUMN "applicationId" DROP NOT NULL',
    );
    await queryRunner.query(
      'ALTER TABLE "core"."applicationVariable" ADD CONSTRAINT "FK_51adb49e7f8df35dd23e01c4830" FOREIGN KEY ("applicationId") REFERENCES "core"."application"("id") ON DELETE CASCADE ON UPDATE NO ACTION',
    );
  }
}
