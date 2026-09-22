import { Module } from '@nestjs/common';

import { CodeInterpreterSessionCleanupCronCommand } from 'src/engine/core-modules/code-interpreter/crons/commands/code-interpreter-session-cleanup.cron.command';
import { CodeInterpreterSessionCleanupCronJob } from 'src/engine/core-modules/code-interpreter/crons/jobs/code-interpreter-session-cleanup.cron.job';

// Wires up the cron command and job that reclaim abandoned code interpreter sandboxes
@Module({
  providers: [
    CodeInterpreterSessionCleanupCronJob,
    CodeInterpreterSessionCleanupCronCommand,
  ],
  exports: [CodeInterpreterSessionCleanupCronCommand],
})
export class CodeInterpreterSessionCleanupModule {}
