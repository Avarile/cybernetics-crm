import { DataSource, QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { SlowInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/slow-instance-command.interface';

@RegisteredInstanceCommand('2.19.0', 1783069673191, { type: 'slow' })
export class BackfillLogoOnApplicationRegistrationSlowInstanceCommand
  implements SlowInstanceCommand
{
  // Only fills rows with no logo yet, deriving it from the manifest already stored
  // on the row (no external fetch needed).
  async runDataMigration(dataSource: DataSource): Promise<void> {
    await dataSource.query(
      `UPDATE "core"."applicationRegistration" SET "logo" = "manifest"->'application'->>'logoUrl' WHERE "manifest" IS NOT NULL AND "logo" IS NULL`,
    );
  }

  public async up(_queryRunner: QueryRunner): Promise<void> {}

  // Unlike up(), this clears "logo" unconditionally on every row, not just the ones
  // this command backfilled — a rollback here also wipes any logo set independently since.
  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'UPDATE "core"."applicationRegistration" SET "logo" = NULL',
    );
  }
}
