// Dispatches incoming public HTTP requests to a workspace's "resolver"
// logic function, which determines the actual target logic function and
// payload to invoke (a level of indirection letting a public URL route to a
// workspace-chosen handler without requiring auth on the resolver itself).
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { isString } from '@sniptt/guards';
import { Request } from 'express';
import { isDefined } from 'twenty-shared/utils';
import { Repository } from 'typeorm';

import {
  LogicFunctionExecutionException,
  LogicFunctionExecutionExceptionCode,
  LogicFunctionExecutorService,
} from 'src/engine/core-modules/logic-function/logic-function-executor/logic-function-executor.service';
import { buildLogicFunctionEvent } from 'src/engine/core-modules/logic-function/logic-function-trigger/triggers/route/utils/build-logic-function-event.util';
import {
  type RouteTriggerResponse,
  buildRouteTriggerResponse,
} from 'src/engine/core-modules/logic-function/logic-function-trigger/triggers/route/utils/route-trigger-response.util';
import {
  ServerRouteTriggerException,
  ServerRouteTriggerExceptionCode,
} from 'src/engine/core-modules/server-route-trigger/exceptions/server-route-trigger.exception';
import { LogicFunctionEntity } from 'src/engine/metadata-modules/logic-function/logic-function.entity';

type ResolverResult = {
  workspaceId: string;
  targetLogicFunctionUniversalIdentifier: string;
  payload?: object;
};

@Injectable()
export class ServerRouteTriggerService {
  private readonly logger = new Logger(ServerRouteTriggerService.name);

  constructor(
    @InjectRepository(LogicFunctionEntity)
    private readonly logicFunctionRepository: Repository<LogicFunctionEntity>,
    private readonly logicFunctionExecutorService: LogicFunctionExecutorService,
  ) {}

  // Finds the resolver logic function, ensures it doesn't require auth,
  // runs it to determine the target function/payload, then runs the target
  // function and returns its response.
  async handle({
    request,
    resolverLogicFunctionUniversalIdentifier,
  }: {
    request: Request;
    resolverLogicFunctionUniversalIdentifier: string;
  }): Promise<RouteTriggerResponse> {
    const resolver = await this.findResolver({
      logicFunctionUniversalIdentifier:
        resolverLogicFunctionUniversalIdentifier,
    });

    if (!isDefined(resolver)) {
      throw new ServerRouteTriggerException(
        `Server resolver function ${resolverLogicFunctionUniversalIdentifier} not found`,
        ServerRouteTriggerExceptionCode.LOGIC_FUNCTION_NOT_FOUND,
      );
    }

    if (resolver.httpRouteTriggerSettings?.isAuthRequired === true) {
      throw new ServerRouteTriggerException(
        `Server resolver function ${resolverLogicFunctionUniversalIdentifier} requires authentication and cannot be dispatched through the public server route`,
        ServerRouteTriggerExceptionCode.RESOLVER_REQUIRES_AUTHENTICATION,
      );
    }

    const applicationRegistrationId =
      resolver.application?.applicationRegistration?.id;

    if (!isDefined(applicationRegistrationId)) {
      throw new ServerRouteTriggerException(
        `Server resolver function ${resolverLogicFunctionUniversalIdentifier} is not linked to an application registration`,
        ServerRouteTriggerExceptionCode.LOGIC_FUNCTION_NOT_FOUND,
      );
    }

    const event = buildLogicFunctionEvent({
      request,
      pathParameters: {},
      forwardedRequestHeaders:
        resolver.serverRouteTriggerSettings?.forwardedRequestHeaders ?? [],
      userWorkspaceId: null,
    });

    const resolverResult = await this.runFunction({
      logicFunctionUniversalIdentifier: resolver.universalIdentifier,
      workspaceId: resolver.workspaceId,
      payload: event,
    });
    const resolved = this.parseResolverResult(resolverResult);

    const targetResult = await this.runFunction({
      logicFunctionUniversalIdentifier:
        resolved.targetLogicFunctionUniversalIdentifier,
      workspaceId: resolved.workspaceId,
      payload: resolved.payload ?? event,
      applicationRegistrationId,
    });

    if (isDefined(targetResult.error)) {
      throw new ServerRouteTriggerException(
        targetResult.error.errorMessage,
        ServerRouteTriggerExceptionCode.SERVER_ROUTE_USER_UNCAUGHT_ERROR,
      );
    }

    return buildRouteTriggerResponse(targetResult.data);
  }

  // Looks up a server-route-trigger-enabled logic function by universal
  // identifier, requiring it belong to its application's owner workspace.
  private async findResolver({
    logicFunctionUniversalIdentifier,
  }: {
    logicFunctionUniversalIdentifier: string;
  }): Promise<LogicFunctionEntity | null> {
    return (
      (await this.logicFunctionRepository
        .createQueryBuilder('logicFunction')
        .innerJoinAndSelect('logicFunction.application', 'application')
        .innerJoinAndSelect(
          'application.applicationRegistration',
          'applicationRegistration',
        )
        .where('logicFunction.universalIdentifier = :universalIdentifier', {
          universalIdentifier: logicFunctionUniversalIdentifier,
        })
        .andWhere('logicFunction.serverRouteTriggerSettings IS NOT NULL')
        .andWhere(
          'logicFunction.workspaceId = applicationRegistration.ownerWorkspaceId',
        )
        .getOne()) ?? null
    );
  }

  // Validates and extracts the resolver's returned target function
  // identifier/workspace/payload, throwing if the shape is invalid.
  private parseResolverResult(result: {
    data: object | null;
    error?: { errorMessage: string };
  }): ResolverResult {
    if (isDefined(result.error)) {
      throw new ServerRouteTriggerException(
        result.error.errorMessage,
        ServerRouteTriggerExceptionCode.SERVER_ROUTE_USER_UNCAUGHT_ERROR,
      );
    }

    const data = result.data as {
      workspaceId?: unknown;
      targetLogicFunctionUniversalIdentifier?: unknown;
      payload?: unknown;
    };

    if (
      !isString(data?.workspaceId) ||
      !isString(data?.targetLogicFunctionUniversalIdentifier)
    ) {
      throw new ServerRouteTriggerException(
        'Resolver logic function must return { workspaceId: string; targetLogicFunctionUniversalIdentifier: string; payload?: object }',
        ServerRouteTriggerExceptionCode.RESOLVER_INVALID_RESULT,
      );
    }

    return {
      workspaceId: data.workspaceId,
      targetLogicFunctionUniversalIdentifier:
        data.targetLogicFunctionUniversalIdentifier,
      payload:
        typeof data.payload === 'object' && data.payload !== null
          ? (data.payload as object)
          : undefined,
    };
  }

  // Looks up and executes a logic function, mapping executor failures to a
  // ServerRouteTriggerException with a sanitized public error message.
  private async runFunction({
    logicFunctionUniversalIdentifier,
    workspaceId,
    payload,
    applicationRegistrationId,
  }: {
    logicFunctionUniversalIdentifier: string;
    workspaceId: string;
    payload: object;
    applicationRegistrationId?: string;
  }): Promise<{ data: object | null; error?: { errorMessage: string } }> {
    const logicFunction = await this.logicFunctionRepository.findOne({
      where: {
        universalIdentifier: logicFunctionUniversalIdentifier,
        workspaceId,
        ...(isDefined(applicationRegistrationId)
          ? { application: { applicationRegistrationId } }
          : {}),
      },
      ...(isDefined(applicationRegistrationId)
        ? { relations: { application: true } }
        : {}),
    });

    if (!isDefined(logicFunction)) {
      throw new ServerRouteTriggerException(
        `Logic function ${logicFunctionUniversalIdentifier} not found in workspace ${workspaceId}`,
        ServerRouteTriggerExceptionCode.LOGIC_FUNCTION_NOT_FOUND,
      );
    }

    try {
      return await this.logicFunctionExecutorService.execute({
        logicFunctionId: logicFunction.id,
        workspaceId,
        payload,
      });
    } catch (error) {
      this.logger.error(
        `Server logic function ${logicFunction.id} failed in workspace ${workspaceId}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      const code = this.mapExecutorErrorToServerRouteCode(error);

      throw new ServerRouteTriggerException(
        this.getPublicErrorMessageForCode(code),
        code,
      );
    }
  }

  // Maps an exception code to a public-safe error message (avoiding leaking
  // internal error details for platform errors).
  private getPublicErrorMessageForCode(
    code: ServerRouteTriggerExceptionCode,
  ): string {
    switch (code) {
      case ServerRouteTriggerExceptionCode.RATE_LIMIT_EXCEEDED:
        return 'Rate limit exceeded';
      case ServerRouteTriggerExceptionCode.LOGIC_FUNCTION_NOT_FOUND:
        return 'Logic function not found';
      default:
        return 'An unexpected error occurred while handling the server route';
    }
  }

  // Translates a LogicFunctionExecutionException code into the
  // corresponding ServerRouteTriggerExceptionCode.
  private mapExecutorErrorToServerRouteCode(
    error: unknown,
  ): ServerRouteTriggerExceptionCode {
    if (!(error instanceof LogicFunctionExecutionException)) {
      return ServerRouteTriggerExceptionCode.SERVER_ROUTE_PLATFORM_ERROR;
    }

    switch (error.code) {
      case LogicFunctionExecutionExceptionCode.LOGIC_FUNCTION_NOT_FOUND:
        return ServerRouteTriggerExceptionCode.LOGIC_FUNCTION_NOT_FOUND;
      case LogicFunctionExecutionExceptionCode.RATE_LIMIT_EXCEEDED:
        return ServerRouteTriggerExceptionCode.RATE_LIMIT_EXCEEDED;
      default:
        return ServerRouteTriggerExceptionCode.SERVER_ROUTE_PLATFORM_ERROR;
    }
  }
}
