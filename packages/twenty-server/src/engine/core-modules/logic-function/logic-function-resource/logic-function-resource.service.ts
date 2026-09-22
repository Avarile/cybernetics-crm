// Manages a logic function's source and built code files in storage: seeding
// new functions from a template project, uploading/reading/copying source
// and built handler files, and preparing dependency files for local builds.
import { Injectable } from '@nestjs/common';

import crypto from 'crypto';
import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { type QueryRunner } from 'typeorm';
import { FileFolder } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import { FileStorageExceptionCode } from 'src/engine/core-modules/file-storage/interfaces/file-storage-exception';

import { FileStorageService } from 'src/engine/core-modules/file-storage/services/file-storage.service';
import {
  getLogicFunctionSeedProjectFiles,
  LogicFunctionSeedProjectFile,
} from 'src/engine/core-modules/logic-function/logic-function-resource/utils/get-logic-function-seed-project-files.util';
import {
  LogicFunctionException,
  LogicFunctionExceptionCode,
} from 'src/engine/metadata-modules/logic-function/logic-function.exception';
import { streamToBuffer } from 'src/utils/stream-to-buffer';

type Identifier = {
  workspaceId: string;
  applicationUniversalIdentifier: string;
};

type SeedSourceFilesParams = Identifier & {
  sourceHandlerPath: string;
  builtHandlerPath: string;
};

type SeedSourceFilesResult = {
  handlerName: string;
  checksum: string;
};

type UpdateSourceFilesParams = Omit<
  SeedSourceFilesParams,
  'builtHandlerPath'
> & {
  sourceHandlerCode: string;
  queryRunner?: QueryRunner;
};

type GetSourceCodeParams = Identifier & {
  sourceHandlerPath: string;
};

type GetBuiltCodeParams = Identifier & {
  builtHandlerPath: string;
};

type CopySourceParams = Identifier & {
  fromSourceHandlerPath: string;
  toSourceHandlerPath: string;
  fromBuiltHandlerPath: string;
  toBuiltHandlerPath: string;
};

@Injectable()
export class LogicFunctionResourceService {
  constructor(private readonly fileStorageService: FileStorageService) {}

  // Writes the seed project's source/built files for a new logic function
  // and returns the resulting handler name and built-code checksum.
  async seedSourceFiles({
    workspaceId,
    applicationUniversalIdentifier,
    sourceHandlerPath,
    builtHandlerPath,
  }: SeedSourceFilesParams): Promise<SeedSourceFilesResult> {
    const seedProjectFiles = await getLogicFunctionSeedProjectFiles();

    const sourceFiles = seedProjectFiles.filter(
      (file: LogicFunctionSeedProjectFile) => file.name.endsWith('index.ts'),
    );
    const builtFiles = seedProjectFiles.filter(
      (file: LogicFunctionSeedProjectFile) => file.name.endsWith('.mjs'),
    );

    if (sourceFiles.length !== 1 || builtFiles.length !== 1) {
      throw new LogicFunctionException(
        'Logic function seed project should have one index.ts file and one index.mjs file',
        LogicFunctionExceptionCode.LOGIC_FUNCTION_INVALID_SEED_PROJECT,
      );
    }

    const sourceFile = sourceFiles[0];
    const builtFile = builtFiles[0];

    await this.fileStorageService.writeFile({
      workspaceId,
      applicationUniversalIdentifier,
      fileFolder: FileFolder.Source,
      resourcePath: sourceHandlerPath,
      sourceFile: sourceFile.content,
      settings: {
        isTemporaryFile: false,
        toDelete: false,
      },
    });

    await this.fileStorageService.writeFile({
      workspaceId,
      applicationUniversalIdentifier,
      fileFolder: FileFolder.BuiltLogicFunction,
      resourcePath: builtHandlerPath,
      sourceFile: builtFile.content,
      settings: {
        isTemporaryFile: false,
        toDelete: false,
      },
    });

    const checksum = crypto
      .createHash('md5')
      .update(builtFile.content)
      .digest('hex');

    return {
      handlerName: 'main',
      checksum,
    };
  }

  // Writes a logic function's source code to storage.
  async uploadSourceFile({
    sourceHandlerPath,
    workspaceId,
    applicationUniversalIdentifier,
    sourceHandlerCode,
    queryRunner,
  }: UpdateSourceFilesParams): Promise<void> {
    await this.fileStorageService.writeFile({
      workspaceId,
      applicationUniversalIdentifier,
      fileFolder: FileFolder.Source,
      resourcePath: sourceHandlerPath,
      sourceFile: sourceHandlerCode,
      settings: { isTemporaryFile: false, toDelete: false },
      queryRunner,
    });
  }

  // Deletes a logic function's source file from storage.
  async deleteSourceFile({
    sourceHandlerPath,
    workspaceId,
    applicationUniversalIdentifier,
  }: GetSourceCodeParams): Promise<void> {
    await this.fileStorageService.deleteFile({
      workspaceId,
      applicationUniversalIdentifier,
      fileFolder: FileFolder.Source,
      resourcePath: sourceHandlerPath,
    });
  }

  // Writes a logic function's compiled/built code to storage.
  async uploadBuiltFile({
    workspaceId,
    applicationUniversalIdentifier,
    builtHandlerPath,
    builtCode,
  }: Identifier & {
    builtHandlerPath: string;
    builtCode: string;
  }): Promise<void> {
    await this.fileStorageService.writeFile({
      workspaceId,
      applicationUniversalIdentifier,
      fileFolder: FileFolder.BuiltLogicFunction,
      resourcePath: builtHandlerPath,
      sourceFile: builtCode,
      settings: {
        isTemporaryFile: false,
        toDelete: false,
      },
    });
  }

  // Reads a logic function's source code, or null if the file doesn't exist.
  async getSourceFile({
    sourceHandlerPath,
    workspaceId,
    applicationUniversalIdentifier,
  }: GetSourceCodeParams): Promise<string | null> {
    try {
      return (
        await streamToBuffer(
          await this.fileStorageService.readFile({
            workspaceId,
            applicationUniversalIdentifier,
            fileFolder: FileFolder.Source,
            resourcePath: sourceHandlerPath,
          }),
        )
      ).toString('utf-8');
    } catch (error) {
      if (
        isDefined(error) &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === FileStorageExceptionCode.FILE_NOT_FOUND
      ) {
        return null;
      }
      throw error;
    }
  }

  // Copies a logic function's source (and built, if present) files to new paths.
  async copyResources({
    fromSourceHandlerPath,
    toSourceHandlerPath,
    fromBuiltHandlerPath,
    toBuiltHandlerPath,
    workspaceId,
    applicationUniversalIdentifier,
  }: CopySourceParams): Promise<void> {
    await this.fileStorageService.copy({
      from: {
        workspaceId,
        applicationUniversalIdentifier,
        fileFolder: FileFolder.Source,
        resourcePath: fromSourceHandlerPath,
      },
      to: {
        workspaceId,
        applicationUniversalIdentifier,
        fileFolder: FileFolder.Source,
        resourcePath: toSourceHandlerPath,
      },
    });

    const builtFileExists = await this.fileStorageService.checkFileExists({
      workspaceId,
      applicationUniversalIdentifier,
      fileFolder: FileFolder.BuiltLogicFunction,
      resourcePath: fromBuiltHandlerPath,
    });

    if (!builtFileExists) {
      return;
    }

    await this.fileStorageService.copy({
      from: {
        workspaceId,
        applicationUniversalIdentifier,
        fileFolder: FileFolder.BuiltLogicFunction,
        resourcePath: fromBuiltHandlerPath,
      },
      to: {
        workspaceId,
        applicationUniversalIdentifier,
        fileFolder: FileFolder.BuiltLogicFunction,
        resourcePath: toBuiltHandlerPath,
      },
    });
  }

  // Downloads an application's package.json/yarn.lock into a local folder
  // for a layer build, synthesizing an empty yarn.lock if none exists, and
  // stripping SDK packages that must not be resolved by the build.
  async copyDependenciesInMemory({
    applicationUniversalIdentifier,
    workspaceId,
    inMemoryFolderPath,
  }: {
    applicationUniversalIdentifier: string;
    workspaceId: string;
    inMemoryFolderPath: string;
  }) {
    const yarnLockExists = await this.fileStorageService.checkFileExists({
      workspaceId,
      applicationUniversalIdentifier,
      fileFolder: FileFolder.Dependencies,
      resourcePath: 'yarn.lock',
    });

    const promises = [];

    promises.push(
      this.fileStorageService.downloadFile({
        workspaceId,
        applicationUniversalIdentifier,
        fileFolder: FileFolder.Dependencies,
        resourcePath: 'package.json',
        localPath: join(inMemoryFolderPath, 'package.json'),
      }),
    );

    if (yarnLockExists) {
      promises.push(
        this.fileStorageService.downloadFile({
          workspaceId,
          applicationUniversalIdentifier,
          fileFolder: FileFolder.Dependencies,
          resourcePath: 'yarn.lock',
          localPath: join(inMemoryFolderPath, 'yarn.lock'),
        }),
      );
    } else {
      const yarnLockPath = join(inMemoryFolderPath, 'yarn.lock');

      promises.push(
        fs.mkdir(dirname(yarnLockPath), { recursive: true }).then(() =>
          fs.writeFile(
            yarnLockPath,
            `# THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY.
# yarn lockfile v1
`,
            'utf-8',
          ),
        ),
      );
    }

    await Promise.all(promises);

    await this.removeBuildTimeSdkFromDependencies(
      join(inMemoryFolderPath, 'package.json'),
    );
  }

  // twenty-sdk is build-time only and twenty-client-sdk is injected at runtime
  // by Twenty (Lambda SDK layer / server-served modules), so neither needs to
  // be resolved by the Lambda yarn install. Apps should already declare them as
  // devDependencies (skipped by `yarn workspaces focus --production`); this is a
  // safety net for apps that still list them under "dependencies".
  private async removeBuildTimeSdkFromDependencies(
    packageJsonPath: string,
  ): Promise<void> {
    const packageJson = JSON.parse(
      await fs.readFile(packageJsonPath, 'utf-8'),
    ) as { dependencies?: Record<string, string> };

    const dependencies = packageJson.dependencies;

    if (!isDefined(dependencies)) {
      return;
    }

    const packagesToRemove = ['twenty-sdk', 'twenty-client-sdk'];

    const packagesToRemoveFromDependencies = packagesToRemove.filter(
      (packageName) => isDefined(dependencies[packageName]),
    );

    if (packagesToRemoveFromDependencies.length === 0) {
      return;
    }

    for (const packageName of packagesToRemoveFromDependencies) {
      delete dependencies[packageName];
    }

    await fs.writeFile(
      packageJsonPath,
      `${JSON.stringify(packageJson, null, 2)}\n`,
      'utf-8',
    );
  }

  // Reads a logic function's built/compiled code as a string.
  async getBuiltCode({
    builtHandlerPath,
    workspaceId,
    applicationUniversalIdentifier,
  }: GetBuiltCodeParams): Promise<string> {
    return (
      await streamToBuffer(
        await this.fileStorageService.readFile({
          workspaceId: workspaceId,
          applicationUniversalIdentifier,
          fileFolder: FileFolder.BuiltLogicFunction,
          resourcePath: builtHandlerPath,
        }),
      )
    ).toString('utf-8');
  }

  // Downloads a logic function's built code into a local folder for execution.
  async copyBuiltCodeInMemory({
    builtHandlerPath,
    workspaceId,
    applicationUniversalIdentifier,
    inMemoryDestinationPath,
  }: GetBuiltCodeParams & {
    inMemoryDestinationPath: string;
  }): Promise<string> {
    const localPath = join(inMemoryDestinationPath, builtHandlerPath);

    await this.fileStorageService.downloadFile({
      workspaceId,
      applicationUniversalIdentifier,
      fileFolder: FileFolder.BuiltLogicFunction,
      resourcePath: builtHandlerPath,
      localPath,
    });

    return localPath;
  }
}
