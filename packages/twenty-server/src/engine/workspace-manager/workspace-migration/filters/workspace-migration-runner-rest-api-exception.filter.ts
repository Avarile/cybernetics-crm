import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  Injectable,
} from '@nestjs/common';

import { type Response } from 'express';
import { QueryFailedError } from 'typeorm';

import { HttpExceptionHandlerService } from 'src/engine/core-modules/exception-handler/http-exception-handler.service';
import {
  WorkspaceMigrationRunnerException,
  WorkspaceMigrationRunnerExceptionCode,
} from 'src/engine/workspace-manager/workspace-migration/workspace-migration-runner/exceptions/workspace-migration-runner.exception';

// Maps WorkspaceMigrationRunnerException into an HTTP error response, unwrapping the underlying
// Postgres QueryFailedError (when the runner failed at the DB layer) so it's reported with its own
// specific error handling instead of the generic runner error
@Injectable()
@Catch(WorkspaceMigrationRunnerException)
export class WorkspaceMigrationRunnerRestApiExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly httpExceptionHandlerService: HttpExceptionHandlerService,
  ) {}

  catch(exception: WorkspaceMigrationRunnerException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    if (
      exception.code === WorkspaceMigrationRunnerExceptionCode.EXECUTION_FAILED
    ) {
      const underlyingError =
        exception.errors?.metadata ??
        exception.errors?.workspaceSchema ??
        exception.errors?.actionTranspilation;

      if (underlyingError instanceof QueryFailedError) {
        return this.httpExceptionHandlerService.handleError(
          underlyingError,
          response,
        );
      }
    }

    return this.httpExceptionHandlerService.handleError(exception, response);
  }
}
