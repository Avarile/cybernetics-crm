import { BadRequestException, Injectable } from '@nestjs/common';

import isEmpty from 'lodash.isempty';
import { ObjectRecord } from 'twenty-shared/types';
import { capitalize } from 'twenty-shared/utils';

import { CommonDeleteManyQueryRunnerService } from 'src/engine/api/common/common-query-runners/common-delete-many-query-runner.service';
import { RestApiBaseHandler } from 'src/engine/api/rest/core/handlers/rest-api-base.handler';
import { parseFilterRestRequest } from 'src/engine/api/rest/input-request-parsers/filter-parser-utils/parse-filter-rest-request.util';
import { AuthenticatedRequest } from 'src/engine/api/rest/types/authenticated-request';
import { workspaceQueryRunnerRestApiExceptionHandler } from 'src/engine/api/rest/utils/workspace-query-runner-rest-api-exception-handler.util';

// REST handler for DELETE /rest/{objects} with a filter: bulk-deletes
// records matching the filter, which is mandatory to avoid accidental
// delete-all.
@Injectable()
export class RestApiDeleteManyHandler extends RestApiBaseHandler {
  constructor(
    private readonly commonDeleteManyQueryRunnerService: CommonDeleteManyQueryRunnerService,
  ) {
    super();
  }

  // Requires a non-empty filter, runs the common deleteMany query runner,
  // and formats the deleted records as a REST response.
  async handle(request: AuthenticatedRequest): Promise<{
    data: {
      [x: string]: ObjectRecord[];
    };
  }> {
    const { filter } = this.parseRequestArgs(request);

    if (isEmpty(filter)) {
      throw new BadRequestException(
        'Filters are mandatory for bulk delete operations. Please provide at least one filter to prevent accidental deletion of all records.',
      );
    }

    const {
      authContext,
      flatObjectMetadata,
      flatObjectMetadataMaps,
      flatFieldMetadataMaps,
      objectIdByNameSingular,
    } = await this.buildCommonOptions(request);

    try {
      const { results: records } =
        await this.commonDeleteManyQueryRunnerService.execute(
          { filter, selectedFields: { id: true } },
          {
            authContext,
            flatObjectMetadata,
            flatObjectMetadataMaps,
            flatFieldMetadataMaps,
            objectIdByNameSingular,
          },
        );

      return this.formatRestResponse(records, flatObjectMetadata.namePlural);
    } catch (error) {
      return workspaceQueryRunnerRestApiExceptionHandler(error);
    }
  }

  private formatRestResponse(
    records: ObjectRecord[],
    objectNamePlural: string,
  ) {
    return {
      data: {
        [`delete${capitalize(objectNamePlural)}`]: records,
      },
    };
  }

  private parseRequestArgs(request: AuthenticatedRequest) {
    const filter = parseFilterRestRequest(request);

    return {
      filter,
    };
  }
}
