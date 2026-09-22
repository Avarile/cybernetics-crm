// Pre-query hook that stamps createdBy/updatedBy actor metadata on records
// being created via a createMany mutation.
import { isDefined } from 'twenty-shared/utils';

import { type WorkspacePreQueryHookInstance } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type CreateManyResolverArgs } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

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

// Pre-query hook run before any object's createMany mutation that injects
// createdBy/updatedBy actor metadata into each record from the auth context.
@WorkspaceQueryHook(`*.createMany`)
export class CreatedByCreateManyPreQueryHook implements WorkspacePreQueryHookInstance {
  constructor(
    private readonly actorFromAuthContextService: ActorFromAuthContextService,
  ) {}

  // Validates payload.data is present, then stamps each record with actor fields.
  async execute(
    authContext: WorkspaceAuthContext,
    objectName: string,
    payload: CreateManyResolverArgs<RecordInput>,
  ): Promise<CreateManyResolverArgs<RecordInput>> {
    if (!isDefined(payload.data)) {
      throw new GraphqlQueryRunnerException(
        'Payload data is required',
        GraphqlQueryRunnerExceptionCode.INVALID_QUERY_INPUT,
        { userFriendlyMessage: STANDARD_ERROR_MESSAGE },
      );
    }

    return {
      ...payload,
      data: await this.actorFromAuthContextService.injectActorFieldsOnCreate({
        records: payload.data,
        objectMetadataNameSingular: objectName,
        authContext,
      }),
    };
  }
}
