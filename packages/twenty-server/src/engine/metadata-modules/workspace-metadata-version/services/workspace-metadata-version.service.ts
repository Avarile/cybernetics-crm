import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { isDefined } from 'twenty-shared/utils';
import { Repository } from 'typeorm';

import { CoreEntityCacheService } from 'src/engine/core-entity-cache/services/core-entity-cache.service';
import { WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';
import {
  WorkspaceMetadataVersionException,
  WorkspaceMetadataVersionExceptionCode,
} from 'src/engine/metadata-modules/workspace-metadata-version/exceptions/workspace-metadata-version.exception';
import { WorkspaceCacheStorageService } from 'src/engine/workspace-cache-storage/workspace-cache-storage.service';

// Bumps a workspace's metadata version whenever its metadata changes, so clients and
// caches can detect staleness.
@Injectable()
export class WorkspaceMetadataVersionService {
  logger = new Logger(WorkspaceMetadataVersionService.name);

  constructor(
    @InjectRepository(WorkspaceEntity)
    private readonly workspaceRepository: Repository<WorkspaceEntity>,
    private readonly workspaceCacheStorageService: WorkspaceCacheStorageService,
    private readonly coreEntityCacheService: CoreEntityCacheService,
  ) {}

  // Increments the workspace's metadata version in the database, cache storage, and
  // invalidates the cached workspace entity; throws if the workspace can't be found.
  async incrementMetadataVersion(workspaceId: string): Promise<void> {
    const workspace = await this.workspaceRepository.findOne({
      select: ['id', 'metadataVersion'],
      where: { id: workspaceId },
      withDeleted: true,
    });

    const metadataVersion = workspace?.metadataVersion;

    if (!isDefined(metadataVersion)) {
      throw new WorkspaceMetadataVersionException(
        'Metadata version not found',
        WorkspaceMetadataVersionExceptionCode.METADATA_VERSION_NOT_FOUND,
      );
    }

    const newMetadataVersion = metadataVersion + 1;

    await this.workspaceRepository.update(
      { id: workspaceId },
      { metadataVersion: newMetadataVersion },
    );

    await this.workspaceCacheStorageService.setMetadataVersion(
      workspaceId,
      newMetadataVersion,
    );

    await this.coreEntityCacheService.invalidate(
      'workspaceEntity',
      workspaceId,
    );
  }
}
