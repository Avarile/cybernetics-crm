import {
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Put,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from '@nestjs/common';

import { Request, Response } from 'express';
import { HTTPMethod } from 'twenty-shared/types';

import { NoPermissionGuard } from 'src/engine/guards/no-permission.guard';
import { PublicEndpointGuard } from 'src/engine/guards/public-endpoint.guard';
import { RouteTriggerRestApiExceptionFilter } from 'src/engine/core-modules/logic-function/logic-function-trigger/triggers/route/exceptions/route-trigger-rest-api-exception-filter';
import { RouteTriggerService } from 'src/engine/core-modules/logic-function/logic-function-trigger/triggers/route/route-trigger.service';
import { sendRouteTriggerResponse } from 'src/engine/core-modules/logic-function/logic-function-trigger/triggers/route/utils/route-trigger-response.util';

// Public catch-all REST endpoint (under /s) that dispatches any HTTP method/path to a
// matching route-trigger logic function.
@Controller('s')
@UseGuards(PublicEndpointGuard, NoPermissionGuard)
@UseFilters(RouteTriggerRestApiExceptionFilter)
export class RouteTriggerController {
  constructor(private readonly routeTriggerService: RouteTriggerService) {}

  // Runs the matching route trigger for the request and writes its response, relaxing
  // CORS headers when the trigger runs on an isolated origin.
  private async handleRequest(
    request: Request,
    response: Response,
    httpMethod: HTTPMethod,
  ) {
    const { response: triggerResponse, isIsolatedOrigin } =
      await this.routeTriggerService.handle({ request, httpMethod });

    sendRouteTriggerResponse(response, triggerResponse, {
      allowAllHeaders: isIsolatedOrigin,
    });
  }

  // Dispatches a GET request to its matching route trigger.
  @Get('*path')
  async get(@Req() request: Request, @Res() response: Response) {
    await this.handleRequest(request, response, HTTPMethod.GET);
  }

  // Dispatches a POST request to its matching route trigger.
  @Post('*path')
  async post(@Req() request: Request, @Res() response: Response) {
    await this.handleRequest(request, response, HTTPMethod.POST);
  }

  // Dispatches a PUT request to its matching route trigger.
  @Put('*path')
  async put(@Req() request: Request, @Res() response: Response) {
    await this.handleRequest(request, response, HTTPMethod.PUT);
  }

  // Dispatches a PATCH request to its matching route trigger.
  @Patch('*path')
  async patch(@Req() request: Request, @Res() response: Response) {
    await this.handleRequest(request, response, HTTPMethod.PATCH);
  }

  // Dispatches a DELETE request to its matching route trigger.
  @Delete('*path')
  async delete(@Req() request: Request, @Res() response: Response) {
    await this.handleRequest(request, response, HTTPMethod.DELETE);
  }
}
