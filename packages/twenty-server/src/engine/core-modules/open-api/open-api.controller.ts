// Public endpoints serving the generated OpenAPI (Swagger) schemas for the
// core REST API and the metadata REST API.
import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';

import { Request, Response } from 'express';

import { OpenApiService } from 'src/engine/core-modules/open-api/open-api.service';
import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';

@Controller()
export class OpenApiController {
  constructor(private readonly openApiService: OpenApiService) {}

  @Get(['open-api/core', 'rest/open-api/core'])
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  // Serves the OpenAPI schema for the workspace's core (record CRUD) REST API.
  async generateOpenApiSchemaCore(
    @Req() request: Request,
    @Res() res: Response,
  ) {
    const data = await this.openApiService.generateCoreSchema(request);

    res.send(data);
  }

  @Get(['open-api/metadata', 'rest/open-api/metadata'])
  @UseGuards(PublicEndpointGuard, NoPermissionGuard)
  // Serves the OpenAPI schema for the workspace's metadata REST API.
  async generateOpenApiSchemaMetaData(
    @Req() request: Request,
    @Res() res: Response,
  ) {
    const data = await this.openApiService.generateMetaDataSchema(request);

    res.send(data);
  }
}
