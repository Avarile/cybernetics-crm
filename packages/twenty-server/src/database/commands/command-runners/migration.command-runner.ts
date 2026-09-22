import { type Logger } from '@nestjs/common';

import chalk from 'chalk';
import { CommandRunner, Option } from 'nest-commander';

import { CommandLogger } from 'src/database/commands/logger';

export type MigrationCommandOptions = {
  dryRun?: boolean;
  verbose?: boolean;
};

// Base class for one-off data-migration CLI commands: adds shared --dry-run/--verbose
// options and wraps the subclass's `runMigrationCommand` with consistent logging.
export abstract class MigrationCommandRunner extends CommandRunner {
  protected logger: CommandLogger | Logger;

  constructor() {
    super();
    this.logger = new CommandLogger({
      verbose: false,
      constructorName: this.constructor.name,
    });
  }

  @Option({
    flags: '-d, --dry-run',
    description: 'Simulate the command without making actual changes',
    required: false,
  })
  parseDryRun(): boolean {
    return true;
  }

  @Option({
    flags: '-v, --verbose',
    description: 'Verbose output',
    required: false,
  })
  parseVerbose(): boolean {
    return true;
  }

  // Switches to a verbose logger if requested, then delegates to the subclass's
  // implementation, logging success/failure.
  override async run(
    passedParams: string[],
    options: MigrationCommandOptions,
  ): Promise<void> {
    if (options.verbose) {
      this.logger = new CommandLogger({
        verbose: true,
        constructorName: this.constructor.name,
      });
    }

    try {
      await this.runMigrationCommand(passedParams, options);

      this.logger.log(chalk.blue('Command completed!'));
    } catch (error) {
      this.logger.error(chalk.red(`Command failed`));
      throw error;
    }
  }

  protected abstract runMigrationCommand(
    passedParams: string[],
    options: MigrationCommandOptions,
  ): Promise<void>;
}
