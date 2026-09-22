// Base class and factory for metadata side effect handlers: each handler
// implements buildSideEffects for a specific (operation, metadataName) pair
// and is tagged with discoverable metadata via the MetadataSideEffectHandler
// decorator-style factory.

import { SetMetadata } from '@nestjs/common';

import { type AllMetadataName } from 'twenty-shared/metadata';

import { type AllFlatEntityOperationRecordByMetadataName } from 'src/engine/metadata-modules/flat-entity/types/all-flat-entity-operation-record-by-metadata-name.type';
import { type MetadataFlatEntityAndRelatedFlatEntityMapsForSideEffect } from 'src/engine/metadata-modules/flat-entity/types/metadata-flat-entity-and-related-flat-entity-maps-for-side-effect.type';
import { type MetadataUniversalFlatEntity } from 'src/engine/metadata-modules/flat-entity/types/metadata-universal-flat-entity.type';
import { METADATA_SIDE_EFFECT_HANDLER_METADATA_KEY } from 'src/engine/metadata-modules/metadata-side-effect/constants/metadata-side-effect-handler-metadata-key.constant';
import { type MetadataSideEffectContext } from 'src/engine/metadata-modules/metadata-side-effect/types/metadata-side-effect-context.type';
import { type MetadataSideEffectOperation } from 'src/engine/metadata-modules/metadata-side-effect/types/metadata-side-effect-operation.type';
import { type MetadataSideEffectResult } from 'src/engine/metadata-modules/metadata-side-effect/types/metadata-side-effect-result.type';

export type BuildSideEffectsArgs<P extends AllMetadataName> = {
  flatEntity: MetadataUniversalFlatEntity<P>;
  allFlatEntityOperationRecordByMetadataName: AllFlatEntityOperationRecordByMetadataName;
  relatedFlatEntityMaps: MetadataFlatEntityAndRelatedFlatEntityMapsForSideEffect<P>;
  context: MetadataSideEffectContext;
};

// Common shape every side effect handler service extends: identifies which
// operation/metadata it handles and computes the resulting side effects.
export abstract class BaseMetadataSideEffectHandlerService<
  P extends AllMetadataName,
> {
  public operation: MetadataSideEffectOperation;
  public metadataName: P;
  public sideEffectName: string;
  public sideEffectDescription: string;

  abstract buildSideEffects(
    args: BuildSideEffectsArgs<P>,
  ): MetadataSideEffectResult;
}

type MetadataSideEffectHandlerDeclaration<P extends AllMetadataName> = {
  operation: MetadataSideEffectOperation;
  metadataName: P;
  name: string;
  description: string;
};

// Creates a base class stamped with the given operation/metadataName/name/
// description, and attaches that same info as reflect metadata so the
// registry can discover it at startup.
export function MetadataSideEffectHandler<P extends AllMetadataName>({
  operation,
  metadataName,
  name,
  description,
}: MetadataSideEffectHandlerDeclaration<P>): typeof BaseMetadataSideEffectHandlerService<P> {
  abstract class SideEffectHandlerService extends BaseMetadataSideEffectHandlerService<P> {
    operation = operation;
    metadataName = metadataName;
    sideEffectName = name;
    sideEffectDescription = description;
  }

  SetMetadata(METADATA_SIDE_EFFECT_HANDLER_METADATA_KEY, {
    operation,
    metadataName,
    name,
    description,
  })(SideEffectHandlerService);

  return SideEffectHandlerService;
}
