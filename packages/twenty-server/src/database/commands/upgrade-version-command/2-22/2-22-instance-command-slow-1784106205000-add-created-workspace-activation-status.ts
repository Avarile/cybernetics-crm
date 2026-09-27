import { DataSource, QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { SlowInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/slow-instance-command.interface';

@RegisteredInstanceCommand('2.22.0', 1784106205000, { type: 'slow' })
export class AddCreatedWorkspaceActivationStatusSlowInstanceCommand
  implements SlowInstanceCommand
{
  // Purely a schema change; no data movement needed beyond the enum recast in up()/down().
  async runDataMigration(_dataSource: DataSource): Promise<void> {
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.swapActivationStatusEnum(queryRunner, {
      enumValues:
        "'ONGOING_CREATION', 'PENDING_CREATION', 'CREATED', 'ACTIVE', 'INACTIVE', 'SUSPENDED'",
      castExpression: '"activationStatus"::"text"',
    });
  }

  // No CREATED value in the old enum, so rows in that new state are folded into
  // ACTIVE (the closest prior status) rather than failing the cast.
  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.swapActivationStatusEnum(queryRunner, {
      enumValues:
        "'ONGOING_CREATION', 'PENDING_CREATION', 'ACTIVE', 'INACTIVE', 'SUSPENDED'",
      castExpression: `CASE WHEN "activationStatus"::"text" = 'CREATED' THEN 'ACTIVE' ELSE "activationStatus"::"text" END`,
    });
  }

  // Postgres can't insert a new enum value in a specific position (between
  // PENDING_CREATION and ACTIVE) via ALTER TYPE ... ADD VALUE, so the whole type is
  // recreated instead: drop CHECK constraints referencing the column (they'd otherwise
  // block or misvalidate the type change), swap the type, recast the column through
  // text, then restore the constraints with their original definitions.
  private async swapActivationStatusEnum(
    queryRunner: QueryRunner,
    {
      enumValues,
      castExpression,
    }: { enumValues: string; castExpression: string },
  ): Promise<void> {
    const checkConstraints: { conname: string; definition: string }[] =
      await queryRunner.query(
        `SELECT conname, pg_get_constraintdef(oid) AS definition
         FROM pg_constraint
         WHERE conrelid = 'core.workspace'::regclass
           AND contype = 'c'
           AND pg_get_constraintdef(oid) ILIKE '%activationStatus%'`,
      );

    for (const { conname } of checkConstraints) {
      await queryRunner.query(
        `ALTER TABLE "core"."workspace" DROP CONSTRAINT "${conname}"`,
      );
    }

    await queryRunner.query(
      `ALTER TYPE "core"."workspace_activationStatus_enum" RENAME TO "workspace_activationStatus_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "core"."workspace_activationStatus_enum" AS ENUM(${enumValues})`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."workspace" ALTER COLUMN "activationStatus" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."workspace" ALTER COLUMN "activationStatus" TYPE "core"."workspace_activationStatus_enum" USING (${castExpression})::"core"."workspace_activationStatus_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "core"."workspace" ALTER COLUMN "activationStatus" SET DEFAULT 'INACTIVE'`,
    );
    await queryRunner.query(
      `DROP TYPE "core"."workspace_activationStatus_enum_old"`,
    );

    for (const { conname, definition } of checkConstraints) {
      await queryRunner.query(
        `ALTER TABLE "core"."workspace" ADD CONSTRAINT "${conname}" ${definition}`,
      );
    }
  }
}
