// Manages the lifecycle of the Lambda function backing a single logic
// function: creating/updating it with the right layers, deploying prebuilt
// bundles, and coordinating concurrent builds via a distributed lock.
import * as fs from 'fs/promises';
import { join } from 'path';

import {
  CreateFunctionCommand,
  type CreateFunctionCommandInput,
  DeleteFunctionCommand,
  GetFunctionCommand,
  type GetFunctionCommandOutput,
  ResourceNotFoundException,
  TagResourceCommand,
  UpdateFunctionCodeCommand,
  UpdateFunctionConfigurationCommand,
} from '@aws-sdk/client-lambda';
import { Logger } from '@nestjs/common';
import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

import { type FlatApplication } from 'src/engine/core-modules/application/types/flat-application.type';
import { type CacheLockService } from 'src/engine/core-modules/cache-lock/cache-lock.service';
import {
  CacheLockException,
  CacheLockExceptionCode,
} from 'src/engine/core-modules/cache-lock/exceptions/cache-lock.exception';
import {
  EXECUTOR_LAMBDA_MEMORY_MB,
  EXECUTOR_LAMBDA_TIMEOUT_SECONDS,
  LAMBDA_EPHEMERAL_STORAGE_MB,
  LAMBDA_PREBUILT_BUNDLE_CHECKSUM_TAG,
  PREBUILT_BUNDLE_FILE_NAME,
  PREBUILT_INSTALL_LOCK_MAX_RETRIES,
  PREBUILT_INSTALL_LOCK_RETRY_MS,
  PREBUILT_INSTALL_LOCK_TTL_MS,
} from 'src/engine/core-modules/logic-function/logic-function-drivers/drivers/lambda/constants/lambda-driver.constant';
import { type LambdaDriverOptions } from 'src/engine/core-modules/logic-function/logic-function-drivers/drivers/lambda/types/lambda-driver.type';
import { type LambdaAwsClientService } from 'src/engine/core-modules/logic-function/logic-function-drivers/drivers/lambda/services/lambda-aws-client.service';
import { type LambdaLayerManagerService } from 'src/engine/core-modules/logic-function/logic-function-drivers/drivers/lambda/services/lambda-layer-manager.service';
import { copyExecutor } from 'src/engine/core-modules/logic-function/logic-function-drivers/utils/copy-executor';
import { createZipFile } from 'src/engine/core-modules/logic-function/logic-function-drivers/utils/create-zip-file';
import { TemporaryDirManager } from 'src/engine/core-modules/logic-function/logic-function-drivers/utils/temporary-dir-manager';
import { type LogicFunctionResourceService } from 'src/engine/core-modules/logic-function/logic-function-resource/logic-function-resource.service';
import {
  LogicFunctionException,
  LogicFunctionExceptionCode,
} from 'src/engine/metadata-modules/logic-function/logic-function.exception';
import { type FlatLogicFunction } from 'src/engine/metadata-modules/logic-function/types/flat-logic-function.type';
import { type WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';

type ExecutorBuildContext = {
  flatLogicFunction: FlatLogicFunction;
  flatApplication: FlatApplication;
  applicationUniversalIdentifier: string;
};

export class LambdaExecutorManagerService {
  private readonly logger = new Logger(LambdaExecutorManagerService.name);

  constructor(
    private readonly options: Pick<LambdaDriverOptions, 'lambdaRole'>,
    private readonly awsClient: LambdaAwsClientService,
    private readonly layerManager: LambdaLayerManagerService,
    private readonly cacheLockService: CacheLockService,
    private readonly logicFunctionResourceService: LogicFunctionResourceService,
    private readonly workspaceCacheService: WorkspaceCacheService,
  ) {}

  // Fetches the Lambda function backing a logic function, or undefined if it
  // doesn't exist yet.
  async getLambdaExecutor(
    flatLogicFunction: FlatLogicFunction,
  ): Promise<GetFunctionCommandOutput | undefined> {
    const lambdaClient = await this.awsClient.getLambdaClient();

    try {
      return await lambdaClient.send(
        new GetFunctionCommand({ FunctionName: flatLogicFunction.id }),
      );
    } catch (error) {
      if (error instanceof ResourceNotFoundException) {
        return undefined;
      }

      throw error;
    }
  }

  // Deletes the Lambda function backing a logic function, if it exists.
  async delete(flatLogicFunction: FlatLogicFunction): Promise<void> {
    const lambdaExecutor = await this.getLambdaExecutor(flatLogicFunction);

    if (!isDefined(lambdaExecutor)) {
      return;
    }

    const lambdaClient = await this.awsClient.getLambdaClient();

    await lambdaClient.send(
      new DeleteFunctionCommand({ FunctionName: flatLogicFunction.id }),
    );
  }

  // Ensures the Lambda executor exists and is up to date, using a
  // per-function lock so concurrent invocations don't rebuild redundantly.
  async buildExecutor(context: ExecutorBuildContext): Promise<void> {
    const { canSkip } = await this.checkBuildStatus(context);

    if (canSkip) {
      return;
    }

    const buildLockTtlMs = 120_000;
    const buildLockRetryMs = 500;
    const buildLockMaxRetries = 240;
    const lockKey = `lambda-build:${context.flatLogicFunction.id}`;

    try {
      await this.cacheLockService.withLock(
        async () => {
          // Refresh the application before re-checking: another process may
          // have rebuilt the SDK layer (and cleared isSdkLayerStale) while we
          // were waiting for the lock, and our request-time snapshot cannot
          // see it. Without this, every queued waiter rebuilds again.
          const refreshedContext = await this.refreshBuildContext(context);

          const { canSkip: canSkipAfterLock, lambdaExecutor } =
            await this.checkBuildStatus(refreshedContext);

          if (canSkipAfterLock) {
            return;
          }

          await this.ensureExecutor({ ...refreshedContext, lambdaExecutor });
        },
        lockKey,
        {
          ttl: buildLockTtlMs,
          ms: buildLockRetryMs,
          maxRetries: buildLockMaxRetries,
        },
      );
    } catch (error) {
      const isLockAcquisitionTimeout =
        error instanceof CacheLockException &&
        error.code === CacheLockExceptionCode.LOCK_ACQUISITION_TIMEOUT;

      if (!isLockAcquisitionTimeout) {
        throw error;
      }

      // Lock wait budget exhausted. If concurrent builds left the executor in
      // a usable state, proceed with the invocation instead of failing it.
      const { canSkip: isExecutorUsable } = await this.checkBuildStatus(
        await this.refreshBuildContext(context),
      );

      if (!isExecutorUsable) {
        throw error;
      }

      this.logger.warn(
        `Lock acquisition timed out for ${lockKey} but executor is up to date, proceeding`,
      );
    }
  }

  // Reloads the flat application from cache so a lock waiter sees layer
  // rebuilds done by whoever held the lock before it.
  private async refreshBuildContext(
    context: ExecutorBuildContext,
  ): Promise<ExecutorBuildContext> {
    const { flatApplicationMaps } =
      await this.workspaceCacheService.getOrRecompute(
        context.flatLogicFunction.workspaceId,
        ['flatApplicationMaps'],
      );

    const refreshedFlatApplication =
      flatApplicationMaps.byId[context.flatApplication.id];

    return {
      ...context,
      flatApplication: refreshedFlatApplication ?? context.flatApplication,
    };
  }

  // Deploys a precompiled bundle's code onto the executor and tags it with
  // its checksum, building the executor first if needed.
  async installPrebuiltBundle(context: ExecutorBuildContext): Promise<void> {
    const { flatLogicFunction, applicationUniversalIdentifier } = context;

    if (!isNonEmptyString(flatLogicFunction.checksum)) {
      throw new LogicFunctionException(
        `Cannot install prebuilt bundle for function '${flatLogicFunction.id}' without a checksum`,
        LogicFunctionExceptionCode.LOGIC_FUNCTION_PREBUILT_BUNDLE_NOT_INSTALLED,
      );
    }

    const checksum = flatLogicFunction.checksum;

    await this.buildExecutor(context);

    await this.cacheLockService.withLock(
      async () => {
        const compiledCode =
          await this.logicFunctionResourceService.getBuiltCode({
            workspaceId: flatLogicFunction.workspaceId,
            applicationUniversalIdentifier,
            builtHandlerPath: flatLogicFunction.builtHandlerPath,
          });

        const temporaryDirManager = new TemporaryDirManager();
        const { sourceTemporaryDir, lambdaZipPath } =
          await temporaryDirManager.init();

        try {
          await copyExecutor(sourceTemporaryDir);
          await fs.writeFile(
            join(sourceTemporaryDir, PREBUILT_BUNDLE_FILE_NAME),
            compiledCode,
            'utf8',
          );
          await createZipFile(sourceTemporaryDir, lambdaZipPath);

          const lambdaClient = await this.awsClient.getLambdaClient();

          const updateResult = await lambdaClient.send(
            new UpdateFunctionCodeCommand({
              FunctionName: flatLogicFunction.id,
              ZipFile: await fs.readFile(lambdaZipPath),
            }),
          );

          await this.awsClient.waitFunctionUpdated(flatLogicFunction.id);

          const functionArn = updateResult.FunctionArn;

          if (!isNonEmptyString(functionArn)) {
            throw new LogicFunctionException(
              `UpdateFunctionCode did not return a FunctionArn for '${flatLogicFunction.id}'`,
              LogicFunctionExceptionCode.LOGIC_FUNCTION_PREBUILT_BUNDLE_NOT_INSTALLED,
            );
          }

          await lambdaClient.send(
            new TagResourceCommand({
              Resource: functionArn,
              Tags: {
                [LAMBDA_PREBUILT_BUNDLE_CHECKSUM_TAG]: checksum,
              },
            }),
          );
        } catch (error) {
          this.logger.error(
            `Failed to install prebuilt bundle for function ${flatLogicFunction.id}: ${error instanceof Error ? error.message : String(error)}`,
            error instanceof Error ? error.stack : undefined,
          );
          throw error;
        } finally {
          await temporaryDirManager.clean();
        }
      },
      `lambda-install:${flatLogicFunction.id}`,
      {
        ttl: PREBUILT_INSTALL_LOCK_TTL_MS,
        ms: PREBUILT_INSTALL_LOCK_RETRY_MS,
        maxRetries: PREBUILT_INSTALL_LOCK_MAX_RETRIES,
      },
    );
  }

  // Returns the checksum tag of the currently installed prebuilt bundle, if any.
  async getInstalledBundleChecksum(
    flatLogicFunction: FlatLogicFunction,
  ): Promise<string | null> {
    const lambdaExecutor = await this.getLambdaExecutor(flatLogicFunction);

    if (!isDefined(lambdaExecutor)) {
      return null;
    }

    return lambdaExecutor.Tags?.[LAMBDA_PREBUILT_BUNDLE_CHECKSUM_TAG] ?? null;
  }

  // Determines whether the existing executor can be reused as-is (active,
  // SDK layer fresh, and both expected layers attached).
  private async checkBuildStatus(context: ExecutorBuildContext): Promise<{
    canSkip: boolean;
    lambdaExecutor: GetFunctionCommandOutput | undefined;
  }> {
    const { flatApplication, applicationUniversalIdentifier } = context;
    const lambdaExecutor = await this.getLambdaExecutor(
      context.flatLogicFunction,
    );

    const isActive = lambdaExecutor?.Configuration?.State === 'Active';

    const canSkip =
      isDefined(lambdaExecutor) &&
      isActive &&
      !flatApplication.isSdkLayerStale &&
      this.layerManager.hasExpectedLayers({
        lambdaExecutor,
        flatApplication,
        applicationUniversalIdentifier,
      });

    return { canSkip, lambdaExecutor };
  }

  // Ensures both dependency layers exist, then creates or updates the
  // executor function to reference them.
  private async ensureExecutor({
    flatLogicFunction,
    flatApplication,
    applicationUniversalIdentifier,
    lambdaExecutor,
  }: ExecutorBuildContext & {
    lambdaExecutor: GetFunctionCommandOutput | undefined;
  }): Promise<void> {
    let depsLayerArn: string;

    try {
      depsLayerArn = await this.layerManager.ensureDepsLayer({
        flatApplication,
        applicationUniversalIdentifier,
      });
    } catch (error) {
      this.logger.error(
        `Failed to get dependency layer for function ${flatLogicFunction.id}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new LogicFunctionException(
        `Failed to get dependency layer for function '${flatLogicFunction.id}': ${error instanceof Error ? error.message : 'Unknown error'}`,
        LogicFunctionExceptionCode.LOGIC_FUNCTION_LAYER_BUILD_FAILED,
      );
    }

    let sdkLayerArn: string;

    try {
      sdkLayerArn = await this.layerManager.ensureSdkLayer({
        flatApplication,
        applicationUniversalIdentifier,
      });
    } catch (error) {
      this.logger.error(
        `Failed to get SDK layer for function ${flatLogicFunction.id}: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new LogicFunctionException(
        `Failed to get SDK layer for function '${flatLogicFunction.id}': ${error instanceof Error ? error.message : 'Unknown error'}`,
        LogicFunctionExceptionCode.LOGIC_FUNCTION_LAYER_BUILD_FAILED,
      );
    }

    if (!isDefined(lambdaExecutor)) {
      await this.createExecutor({
        flatLogicFunction,
        depsLayerArn,
        sdkLayerArn,
      });
      await this.awsClient.waitFunctionActive(flatLogicFunction.id);

      return;
    }

    await this.updateExecutorConfiguration({
      flatLogicFunction,
      depsLayerArn,
      sdkLayerArn,
    });
    await this.awsClient.waitFunctionUpdated(flatLogicFunction.id);
  }

  // Updates an existing Lambda function's layers/runtime/timeout/memory config.
  private async updateExecutorConfiguration({
    flatLogicFunction,
    depsLayerArn,
    sdkLayerArn,
  }: {
    flatLogicFunction: FlatLogicFunction;
    depsLayerArn: string;
    sdkLayerArn: string;
  }): Promise<void> {
    const lambdaClient = await this.awsClient.getLambdaClient();

    await lambdaClient.send(
      new UpdateFunctionConfigurationCommand({
        FunctionName: flatLogicFunction.id,
        Layers: [depsLayerArn, sdkLayerArn],
        Runtime: flatLogicFunction.runtime,
        Timeout: EXECUTOR_LAMBDA_TIMEOUT_SECONDS,
        MemorySize: EXECUTOR_LAMBDA_MEMORY_MB,
      }),
    );
  }

  // Zips the executor runtime and creates the Lambda function with its layers.
  private async createExecutor({
    flatLogicFunction,
    depsLayerArn,
    sdkLayerArn,
  }: {
    flatLogicFunction: FlatLogicFunction;
    depsLayerArn: string;
    sdkLayerArn: string;
  }): Promise<void> {
    const temporaryDirManager = new TemporaryDirManager();
    const { sourceTemporaryDir, lambdaZipPath } =
      await temporaryDirManager.init();

    try {
      await copyExecutor(sourceTemporaryDir);
      await createZipFile(sourceTemporaryDir, lambdaZipPath);

      // SDK layer listed last so it overwrites the stub twenty-client-sdk
      // from the deps layer (later layers take precedence in /opt merge).
      const params: CreateFunctionCommandInput = {
        Code: {
          ZipFile: await fs.readFile(lambdaZipPath),
        },
        FunctionName: flatLogicFunction.id,
        Layers: [depsLayerArn, sdkLayerArn],
        Handler: 'index.handler',
        Role: this.options.lambdaRole,
        Runtime: flatLogicFunction.runtime,
        Timeout: EXECUTOR_LAMBDA_TIMEOUT_SECONDS,
        MemorySize: EXECUTOR_LAMBDA_MEMORY_MB,
        EphemeralStorage: { Size: LAMBDA_EPHEMERAL_STORAGE_MB },
      };

      const lambdaClient = await this.awsClient.getLambdaClient();

      await lambdaClient.send(new CreateFunctionCommand(params));
    } finally {
      await temporaryDirManager.clean();
    }
  }
}
