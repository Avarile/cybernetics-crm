// Pre-query hook that stamps updatedBy actor metadata on a record being
// updated via an updateOne mutation.
import { isDefined } from 'twenty-shared/utils';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type UpdateOneResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { STANDARD_ERROR_MESSAGE } from 'src/engine/api/common/common-query-runners/errors/standard-error-message.constant';
import {
  GraphqlQueryRunnerException,
  GraphqlQueryRunnerExceptionCode,
} from 'src/engine/api/graphql/graphql-query-runner/errors/graphql-query-runner.exception';
import { WorkspaceQueryHook } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import {
  ActorFromAuthContextService,
  type RecordInput,
} from 'src/engine/core-modules/actor/services/actor-from-auth-context.service';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';

// Pre-query hook run before any object's updateOne mutation that injects
// updatedBy actor metadata into the update payload from the auth context.
@WorkspaceQueryHook(`*.updateOne`)
export class UpdatedByUpdateOnePreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly actorFromAuthContextService: ActorFromAuthContextService,
  ) {}

  // Validates payload.data is present, then stamps the update payload with updatedBy.
  async execute(
    authContext: WorkspaceAuthContext,
    objectName: string,
    payload: UpdateOneResolverArgs<RecordInput>,
  ): Promise<UpdateOneResolverArgs<RecordInput>> {
    if (!isDefined(payload.data)) {
      throw new GraphqlQueryRunnerException(
        'Payload data is required',
        GraphqlQueryRunnerExceptionCode.INVALID_QUERY_INPUT,
        { userFriendlyMessage: STANDARD_ERROR_MESSAGE },
      );
    }

    const [recordToUpdateData] =
      await this.actorFromAuthContextService.injectUpdatedBy({
        records: [payload.data],
        objectMetadataNameSingular: objectName,
        authContext,
      });

    return {
      ...payload,
      data: recordToUpdateData,
    };
  }
}
