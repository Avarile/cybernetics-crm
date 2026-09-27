import { type FlatApplication } from 'src/engine/core-modules/application/types/flat-application.type';
import { type FlatEntityMaps } from 'src/engine/metadata-modules/flat-entity/types/flat-entity-maps.type';
import { getFlatObjectMetadataMock } from 'src/engine/metadata-modules/flat-object-metadata/__mocks__/get-flat-object-metadata.mock';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { buildDefaultRelationFlatFieldMetadatasForCustomObject } from 'src/engine/metadata-modules/object-metadata/utils/build-default-relation-flat-field-metadatas-for-custom-object.util';

const EMPTY_FLAT_OBJECT_METADATA_MAPS = {
  byUniversalIdentifier: {},
  universalIdentifierById: {},
  universalIdentifiersByApplicationId: {},
} as unknown as FlatEntityMaps<FlatObjectMetadata>;

const SOURCE_FLAT_OBJECT_METADATA = getFlatObjectMetadataMock({
  universalIdentifier: 'custom-object-universal-identifier',
  nameSingular: 'invoice',
  namePlural: 'invoices',
});

const FLAT_APPLICATION = {
  id: 'application-id',
  universalIdentifier: 'application-universal-identifier',
} as FlatApplication;

describe('buildDefaultRelationFlatFieldMetadatasForCustomObject', () => {
  it('should skip databaseRecordTarget in workspaces that predate the data centre integration', () => {
    expect(
      buildDefaultRelationFlatFieldMetadatasForCustomObject({
        existingFlatObjectMetadataMaps: EMPTY_FLAT_OBJECT_METADATA_MAPS,
        sourceFlatObjectMetadata: SOURCE_FLAT_OBJECT_METADATA,
        flatApplication: FLAT_APPLICATION,
        relationObjectNameSingulars: ['databaseRecordTarget'],
      }),
    ).toEqual({
      standardSourceFlatFieldMetadatas: [],
      standardTargetFlatFieldMetadatas: [],
      standardTargetFlatIndexMetadatas: [],
    });
  });

  it('should still fail when another default relation object is missing', () => {
    expect(() =>
      buildDefaultRelationFlatFieldMetadatasForCustomObject({
        existingFlatObjectMetadataMaps: EMPTY_FLAT_OBJECT_METADATA_MAPS,
        sourceFlatObjectMetadata: SOURCE_FLAT_OBJECT_METADATA,
        flatApplication: FLAT_APPLICATION,
        relationObjectNameSingulars: ['attachment'],
      }),
    ).toThrow();
  });
});
