import {
  Controller,
  Delete,
  Get,
  Logger,
  Patch,
  Post,
  Put,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { Response } from 'express';

import { RestApiCoreService } from 'src/engine/api/rest/core/services/rest-api-core.service';
import { RestApiExceptionFilter } from 'src/engine/api/rest/rest-api-exception.filter';
import { AuthenticatedRequest } from 'src/engine/api/rest/types/authenticated-request';
import { CustomPermissionGuard } from 'src/engine/guards/custom-permission.guard';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';

// REST controller exposing CRUD-style endpoints for workspace records
// (`/rest/*`), mapping HTTP verbs and path suffixes onto the corresponding
// RestApiCoreService operation.
@Controller('rest')
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard, CustomPermissionGuard)
@UseFilters(RestApiExceptionFilter)
export class RestApiCoreController {
  private readonly logger = new Logger(RestApiCoreController.name);
  constructor(private readonly restApiCoreService: RestApiCoreService) {}

  // POST /rest/batch/{objects} — creates many records at once.
  @Post('batch/*path')
  async handleApiPostBatch(
    @Req() request: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    this.logger.log(
      `[REST API] Processing BATCH request to ${request.path} on workspace ${request.workspaceId}`,
    );
    const result = await this.restApiCoreService.createMany(request);

    res.status(201).send(result);
  }

  // POST /rest/{objects}/duplicates — finds duplicate records.
  @Post('*path/duplicates')
  async handleApiFindDuplicates(
    @Req() request: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    this.logger.log(
      `[REST API] Processing DUPLICATES request to ${request.path} on workspace ${request.workspaceId}`,
    );
    const result = await this.restApiCoreService.findDuplicates(request);

    res.status(200).send(result);
  }

  // POST /rest/{objects} — creates a single record.
  @Post('*path')
  async handleApiPost(
    @Req() request: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    this.logger.log(
      `[REST API] Processing POST request to ${request.path} on workspace ${request.workspaceId}`,
    );
    const result = await this.restApiCoreService.createOne(request);

    res.status(201).send(result);
  }

  // GET /rest/{objects}/groupBy — aggregates records into groups.
  @Get('*path/groupBy')
  async handleApiGroupBy(
    @Req() request: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    this.logger.log(
      `[REST API] Processing GROUP BY request to ${request.path} on workspace ${request.workspaceId}`,
    );
    const result = await this.restApiCoreService.groupBy(request);

    res.status(200).send(result);
  }

  // GET /rest/{objects} or /rest/{objects}/{id} — lists or fetches records.
  @Get('*path')
  async handleApiGet(
    @Req() request: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    this.logger.log(
      `[REST API] Processing GET request to ${request.path} on workspace ${request.workspaceId}`,
    );
    const result = await this.restApiCoreService.get(request);

    res.status(200).send(result);
  }

  // DELETE /rest/{objects}/{id} — soft-deletes a record.
  @Delete('*path')
  async handleApiDelete(
    @Req() request: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    this.logger.log(
      `[REST API] Processing DELETE request to ${request.path} on workspace ${request.workspaceId}`,
    );
    const result = await this.restApiCoreService.delete(request);

    res.status(200).send(result);
  }

  // PATCH /rest/restore/{objects}/{id} — restores a soft-deleted record.
  @Patch('restore/*path')
  async handleApiRestore(
    @Req() request: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    this.logger.log(
      `[REST API] Processing RESTORE request to ${request.path} on workspace ${request.workspaceId}`,
    );
    const result = await this.restApiCoreService.restore(request);

    res.status(200).send(result);
  }

  // PATCH /rest/{objects}/merge — merges several records into one.
  @Patch('*path/merge')
  async handleApiMerge(
    @Req() request: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    this.logger.log(
      `[REST API] Processing MERGE request to ${request.path} on workspace ${request.workspaceId}`,
    );
    const result = await this.restApiCoreService.mergeMany(request);

    res.status(200).send(result);
  }

  // PATCH /rest/{objects}/{id} — updates a record.
  @Patch('*path')
  async handleApiPatch(
    @Req() request: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    this.logger.log(
      `[REST API] Processing PATCH request to ${request.path} on workspace ${request.workspaceId}`,
    );
    const result = await this.restApiCoreService.update(request);

    res.status(200).send(result);
  }

  // This endpoint is not documented in the OpenAPI schema.
  // We keep it to avoid a breaking change since it initially used PUT instead
  // of PATCH, and because the PUT verb is often used as a PATCH.
  // PUT /rest/{objects}/{id} — legacy alias for PATCH update, kept for
  // backward compatibility.
  @Put('*path')
  async handleApiPut(
    @Req() request: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    this.logger.log(
      `[REST API] Processing PUT request to ${request.path} on workspace ${request.workspaceId}`,
    );
    const result = await this.restApiCoreService.update(request);

    res.status(200).send(result);
  }
}
