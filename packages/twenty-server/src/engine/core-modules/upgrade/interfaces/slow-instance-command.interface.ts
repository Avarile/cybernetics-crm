import { type DataSource } from 'typeorm';

import { type FastInstanceCommand } from 'src/engine/core-modules/upgrade/interfaces/fast-instance-command.interface';

// Contract for an instance command that also backfills data, run separately
// from the schema migration transaction since it may be long-running
export interface SlowInstanceCommand extends FastInstanceCommand {
  runDataMigration(dataSource: DataSource): Promise<void>;
}
