import { Injectable } from '@nestjs/common';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';

import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { ForbiddenError } from 'src/engine/core-modules/graphql/utils/graphql-errors.util';

// databaseConnection rows hold the workspace's data-centre credentials and
// must only change through the settings-permission guarded resolvers.
// Through the generic record API, a member with plain object permissions
// could otherwise re-point baseUrl at their own host and receive the
// decrypted token on the next request, so every generic operation is refused.
abstract class DatabaseConnectionGenericApiBlockerPreQueryHook implements WorkspacePreQueryHookInstance {
  async execute(): Promise<never> {
    throw new ForbiddenError(
      'The data centre connection can only be managed from Settings',
    );
  }
}

@Injectable()
@WorkspaceQueryHook(`databaseConnection.findMany`)
export class DatabaseConnectionFindManyBlockerPreQueryHook extends DatabaseConnectionGenericApiBlockerPreQueryHook {}

@Injectable()
@WorkspaceQueryHook(`databaseConnection.findOne`)
export class DatabaseConnectionFindOneBlockerPreQueryHook extends DatabaseConnectionGenericApiBlockerPreQueryHook {}

@Injectable()
@WorkspaceQueryHook(`databaseConnection.findDuplicates`)
export class DatabaseConnectionFindDuplicatesBlockerPreQueryHook extends DatabaseConnectionGenericApiBlockerPreQueryHook {}

@Injectable()
@WorkspaceQueryHook(`databaseConnection.groupBy`)
export class DatabaseConnectionGroupByBlockerPreQueryHook extends DatabaseConnectionGenericApiBlockerPreQueryHook {}

@Injectable()
@WorkspaceQueryHook(`databaseConnection.createMany`)
export class DatabaseConnectionCreateManyBlockerPreQueryHook extends DatabaseConnectionGenericApiBlockerPreQueryHook {}

@Injectable()
@WorkspaceQueryHook(`databaseConnection.createOne`)
export class DatabaseConnectionCreateOneBlockerPreQueryHook extends DatabaseConnectionGenericApiBlockerPreQueryHook {}

@Injectable()
@WorkspaceQueryHook(`databaseConnection.updateOne`)
export class DatabaseConnectionUpdateOneBlockerPreQueryHook extends DatabaseConnectionGenericApiBlockerPreQueryHook {}

@Injectable()
@WorkspaceQueryHook(`databaseConnection.deleteOne`)
export class DatabaseConnectionDeleteOneBlockerPreQueryHook extends DatabaseConnectionGenericApiBlockerPreQueryHook {}

@Injectable()
@WorkspaceQueryHook(`databaseConnection.updateMany`)
export class DatabaseConnectionUpdateManyBlockerPreQueryHook extends DatabaseConnectionGenericApiBlockerPreQueryHook {}

@Injectable()
@WorkspaceQueryHook(`databaseConnection.deleteMany`)
export class DatabaseConnectionDeleteManyBlockerPreQueryHook extends DatabaseConnectionGenericApiBlockerPreQueryHook {}

@Injectable()
@WorkspaceQueryHook(`databaseConnection.destroyOne`)
export class DatabaseConnectionDestroyOneBlockerPreQueryHook extends DatabaseConnectionGenericApiBlockerPreQueryHook {}

@Injectable()
@WorkspaceQueryHook(`databaseConnection.destroyMany`)
export class DatabaseConnectionDestroyManyBlockerPreQueryHook extends DatabaseConnectionGenericApiBlockerPreQueryHook {}

@Injectable()
@WorkspaceQueryHook(`databaseConnection.restoreOne`)
export class DatabaseConnectionRestoreOneBlockerPreQueryHook extends DatabaseConnectionGenericApiBlockerPreQueryHook {}

@Injectable()
@WorkspaceQueryHook(`databaseConnection.restoreMany`)
export class DatabaseConnectionRestoreManyBlockerPreQueryHook extends DatabaseConnectionGenericApiBlockerPreQueryHook {}

@Injectable()
@WorkspaceQueryHook(`databaseConnection.mergeMany`)
export class DatabaseConnectionMergeManyBlockerPreQueryHook extends DatabaseConnectionGenericApiBlockerPreQueryHook {}

export const DATABASE_CONNECTION_GENERIC_API_BLOCKER_PRE_QUERY_HOOKS = [
  DatabaseConnectionFindManyBlockerPreQueryHook,
  DatabaseConnectionFindOneBlockerPreQueryHook,
  DatabaseConnectionFindDuplicatesBlockerPreQueryHook,
  DatabaseConnectionGroupByBlockerPreQueryHook,
  DatabaseConnectionCreateManyBlockerPreQueryHook,
  DatabaseConnectionCreateOneBlockerPreQueryHook,
  DatabaseConnectionUpdateOneBlockerPreQueryHook,
  DatabaseConnectionDeleteOneBlockerPreQueryHook,
  DatabaseConnectionUpdateManyBlockerPreQueryHook,
  DatabaseConnectionDeleteManyBlockerPreQueryHook,
  DatabaseConnectionDestroyOneBlockerPreQueryHook,
  DatabaseConnectionDestroyManyBlockerPreQueryHook,
  DatabaseConnectionRestoreOneBlockerPreQueryHook,
  DatabaseConnectionRestoreManyBlockerPreQueryHook,
  DatabaseConnectionMergeManyBlockerPreQueryHook,
];
