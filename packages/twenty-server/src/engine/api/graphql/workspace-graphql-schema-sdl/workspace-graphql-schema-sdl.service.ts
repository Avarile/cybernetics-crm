// Produces a workspace's GraphQL SDL (schema-definition-language string)
// and its used scalar names, cached per workspace + metadata version (and
// optionally scoped to one application's objects), regenerating from
// metadata only on a cache miss.
import { Injectable } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';
import { printSchema } from 'graphql';
import { isDefined } from 'twenty-shared/utils';

import { ScalarsExplorerService } from 'src/engine/api/graphql/services/scalars-explorer.service';
import { WorkspaceGraphQLSchemaGenerator } from 'src/engine/api/graphql/workspace-schema-builder/workspace-graphql-schema.factory';
import { FlatWorkspace } from 'src/engine/core-modules/workspace/types/flat-workspace.type';
import {
  FlatEntityMapsException,
  FlatEntityMapsExceptionCode,
} from 'src/engine/metadata-modules/flat-entity/exceptions/flat-entity-maps.exception';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { getSubFlatEntityMapsByApplicationIdsOrThrow } from 'src/engine/metadata-modules/flat-entity/utils/get-sub-flat-entity-maps-by-application-ids-or-throw.util';
import { type FlatFieldMetadata } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata.type';
import { type FlatIndexMetadata } from 'src/engine/metadata-modules/flat-index-metadata/types/flat-index-metadata.type';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { WorkspaceCacheStorageService } from 'src/engine/workspace-cache-storage/workspace-cache-storage.service';
import { TWENTY_STANDARD_APPLICATION } from 'src/engine/workspace-manager/twenty-standard-application/constants/twenty-standard-applications';

export type WorkspaceGraphqlSchemaSDLResult = {
  sdl: string;
  usedScalarNames: string[];
  flatObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>;
  flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>;
  flatIndexMaps: FlatEntityMaps<FlatIndexMetadata>;
};

@Injectable()
export class WorkspaceGraphqlSchemaSDLService {
  constructor(
    private readonly scalarsExplorerService: ScalarsExplorerService,
    private readonly workspaceGraphQLSchemaGenerator: WorkspaceGraphQLSchemaGenerator,
    private readonly workspaceCacheStorageService: WorkspaceCacheStorageService,
    private readonly workspaceManyOrAllFlatEntityMapsCacheService: WorkspaceManyOrAllFlatEntityMapsCacheService,
  ) {}

  // Returns the workspace's SDL and scalar names, from cache when the
  // metadata version hasn't changed, otherwise regenerating and caching
  // it. When applicationId is given, filters metadata down to just that
  // application (plus the standard Twenty application) before generating.
  // Returns null if the workspace has no database schema yet.
  async getOrComputeSchemaSDL(
    workspace: FlatWorkspace,
    applicationId?: string,
  ): Promise<WorkspaceGraphqlSchemaSDLResult | null> {
    if (!isNonEmptyString(workspace.databaseSchema)) {
      return null;
    }

    const {
      flatObjectMetadataMaps: allFlatObjectMetadataMaps,
      flatFieldMetadataMaps: allFlatFieldMetadataMaps,
      flatIndexMaps: allFlatIndexMaps,
      flatApplicationMaps,
    } = await this.workspaceManyOrAllFlatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
      {
        workspaceId: workspace.id,
        flatMapsKeys: [
          'flatObjectMetadataMaps',
          'flatFieldMetadataMaps',
          'flatIndexMaps',
          'flatApplicationMaps',
        ],
      },
    );

    if (!isDefined(allFlatObjectMetadataMaps)) {
      throw new FlatEntityMapsException(
        'Object metadata collection not found',
        FlatEntityMapsExceptionCode.ENTITY_NOT_FOUND,
      );
    }

    if (!isDefined(allFlatFieldMetadataMaps)) {
      throw new FlatEntityMapsException(
        'Field metadata collection not found',
        FlatEntityMapsExceptionCode.ENTITY_NOT_FOUND,
      );
    }

    let flatObjectMetadataMaps = allFlatObjectMetadataMaps;
    let flatFieldMetadataMaps = allFlatFieldMetadataMaps;
    let flatIndexMaps = allFlatIndexMaps;

    if (isDefined(applicationId)) {
      const twentyStandardApplicationId =
        flatApplicationMaps?.idByUniversalIdentifier[
          TWENTY_STANDARD_APPLICATION.universalIdentifier
        ];

      const applicationIds = isDefined(twentyStandardApplicationId)
        ? [twentyStandardApplicationId, applicationId]
        : [applicationId];

      flatObjectMetadataMaps = this.filterFlatEntityMapsByApplicationIds(
        allFlatObjectMetadataMaps,
        applicationIds,
      );
      flatFieldMetadataMaps = this.filterFlatEntityMapsByApplicationIds(
        allFlatFieldMetadataMaps,
        applicationIds,
      );

      flatObjectMetadataMaps =
        this.reconcileObjectFieldIdsWithFilteredFieldMaps(
          flatObjectMetadataMaps,
          flatFieldMetadataMaps,
        );

      if (isDefined(allFlatIndexMaps)) {
        flatIndexMaps = this.filterFlatEntityMapsByApplicationIds(
          allFlatIndexMaps,
          applicationIds,
        );
      }
    }

    let metadataVersion =
      await this.workspaceCacheStorageService.getMetadataVersion(workspace.id);

    if (!isDefined(metadataVersion)) {
      metadataVersion = isDefined(workspace.metadataVersion)
        ? workspace.metadataVersion
        : 0;
      await this.workspaceCacheStorageService.setMetadataVersion(
        workspace.id,
        metadataVersion,
      );
    }

    let sdl = await this.workspaceCacheStorageService.getGraphQLTypeDefs(
      workspace.id,
      metadataVersion,
      applicationId,
    );
    let usedScalarNames =
      await this.workspaceCacheStorageService.getGraphQLUsedScalarNames(
        workspace.id,
        metadataVersion,
        applicationId,
      );

    if (!sdl || !usedScalarNames) {
      const autoGeneratedSchema =
        await this.workspaceGraphQLSchemaGenerator.generateSchema({
          flatObjectMetadataMaps,
          flatFieldMetadataMaps,
          flatIndexMaps,
        });

      usedScalarNames =
        this.scalarsExplorerService.getUsedScalarNames(autoGeneratedSchema);
      sdl = printSchema(autoGeneratedSchema);

      await this.workspaceCacheStorageService.setGraphQLTypeDefs(
        workspace.id,
        metadataVersion,
        sdl,
        applicationId,
      );
      await this.workspaceCacheStorageService.setGraphQLUsedScalarNames(
        workspace.id,
        metadataVersion,
        usedScalarNames,
        applicationId,
      );
    }

    return {
      sdl,
      usedScalarNames,
      flatObjectMetadataMaps,
      flatFieldMetadataMaps,
      flatIndexMaps,
    };
  }

  // After filtering fields down to an application's subset, drops
  // references to now-missing field ids from each object's fieldIds so
  // the schema generator doesn't try to build types for removed fields.
  private reconcileObjectFieldIdsWithFilteredFieldMaps(
    flatObjectMetadataMaps: FlatEntityMaps<FlatObjectMetadata>,
    flatFieldMetadataMaps: FlatEntityMaps<FlatFieldMetadata>,
  ): FlatEntityMaps<FlatObjectMetadata> {
    const filteredFieldIds = new Set(
      Object.keys(flatFieldMetadataMaps.universalIdentifierById),
    );

    const reconciledByUniversalIdentifier: Partial<
      Record<string, FlatObjectMetadata>
    > = {};

    for (const [universalId, object] of Object.entries(
      flatObjectMetadataMaps.byUniversalIdentifier,
    )) {
      if (!isDefined(object)) continue;

      reconciledByUniversalIdentifier[universalId] = {
        ...object,
        fieldIds: object.fieldIds.filter((id) => filteredFieldIds.has(id)),
      };
    }

    return {
      ...flatObjectMetadataMaps,
      byUniversalIdentifier: reconciledByUniversalIdentifier,
    };
  }

  // Restricts a flat entity map to only entries belonging to the given application ids.
  private filterFlatEntityMapsByApplicationIds<
    T extends FlatObjectMetadata | FlatFieldMetadata | FlatIndexMetadata,
  >(
    flatEntityMaps: FlatEntityMaps<T>,
    applicationIds: string[],
  ): FlatEntityMaps<T> {
    return getSubFlatEntityMapsByApplicationIdsOrThrow({
      applicationIds,
      flatEntityMaps,
    });
  }
}
