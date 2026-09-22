import chalk from 'chalk';
import { Command, CommandRunner, Option } from 'nest-commander';
import { isDefined } from 'twenty-shared/utils';

import { WorkspaceIteratorService } from 'src/database/commands/command-runners/workspace-iterator.service';
import { CommandLogger } from 'src/database/commands/logger';
import { ApplicationService } from 'src/engine/core-modules/application/application.service';
import { type FlatApplication } from 'src/engine/core-modules/application/types/flat-application.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';

type RebuildDefaultPackageFilesCommandOptions = {
  workspaceId?: Set<string>;
};

// CLI command (`application:rebuild-default-deps`): re-generates and re-uploads
// the default package.json/yarn.lock files for every (non-deleted) application in
// one workspace, or in all provisioned workspaces if no --workspace-id is given.
@Command({
  name: 'application:rebuild-default-deps',
  description:
    'Re-upload default package.json and yarn.lock to file storage for all applications in the workspace',
})
export class RebuildApplicationDefaultDepsCommand extends CommandRunner {
  protected logger: CommandLogger;

  constructor(
    private readonly workspaceIteratorService: WorkspaceIteratorService,
    private readonly applicationService: ApplicationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
  ) {
    super();
    this.logger = new CommandLogger({
      verbose: false,
      constructorName: this.constructor.name,
    });
  }

  @Option({
    flags: '-w, --workspace-id [workspace_id]',
    description:
      'workspace id. Command runs on all provisioned workspaces if not provided.',
    required: false,
  })
  parseWorkspaceId(val: string, previous?: Set<string>): Set<string> {
    const accumulator = previous ?? new Set<string>();

    accumulator.add(val);

    return accumulator;
  }

  // Iterates the target workspace(s) and re-uploads default dependency files for
  // every application found, throwing if any workspace in the iteration failed.
  override async run(
    _passedParams: string[],
    options: RebuildDefaultPackageFilesCommandOptions,
  ): Promise<void> {
    const workspaceIds = isDefined(options.workspaceId)
      ? Array.from(options.workspaceId)
      : undefined;
    const report = await this.workspaceIteratorService.iterate({
      workspaceIds,
      callback: async ({ workspaceId }) => {
        const { flatApplicationMaps } =
          await this.workspaceCacheService.getOrRecompute(workspaceId, [
            'flatApplicationMaps',
          ]);

        const applications = Object.values(flatApplicationMaps.byId).filter(
          (application): application is FlatApplication =>
            isDefined(application) && !isDefined(application.deletedAt),
        );

        this.logger.log(
          `Found ${applications.length} application(s) in workspace ${workspaceId}`,
        );

        for (const application of applications) {
          await this.applicationService.uploadDefaultPackageFilesAndSetFileIds({
            id: application.id,
            universalIdentifier: application.universalIdentifier,
            workspaceId,
          });
          this.logger.log(
            `Rebuilt default package files for application "${application.name}" (${application.id})`,
          );
        }
      },
    });

    if (report.fail.length > 0) {
      throw new Error(
        `Command completed with ${report.fail.length} failure(s)`,
      );
    }

    this.logger.log(chalk.blue('Command completed!'));
  }
}
