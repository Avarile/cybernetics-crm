import { type QueryRunner } from 'typeorm';

import { RegisteredInstanceCommand } from 'src/engine/core-modules/upgrade/decorators/registered-instance-command.decorator';
import { type FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

// Fast instance command (1.21.0): widens messageFolder.parentFolderId from uuid to
// varchar (to support non-uuid external parent ids); down casts it back to uuid.
@RegisteredInstanceCommand('1.21.0', 1775165049548)
export class MigrateMessagingCalendarToCoreFastInstanceCommand implements FastInstanceCommand {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."messageFolder" ALTER COLUMN "parentFolderId" TYPE character varying`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "core"."messageFolder" ALTER COLUMN "parentFolderId" TYPE uuid USING "parentFolderId"::uuid`,
    );
  }
}
