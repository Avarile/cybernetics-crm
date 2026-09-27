// Referenced by @WasIntroducedInUpgrade on SearchFieldMetadataEntity's class-level
// decorator: this is when the entity started extending SyncableEntity, gaining its
// "universalIdentifier"/"applicationId" columns, so pre-2.16 upgrade steps don't
// SELECT them before this command adds them.
export const ADD_UNIVERSAL_IDENTIFIER_AND_APPLICATION_ID_TO_SEARCH_FIELD_METADATA_UPGRADE_COMMAND_NAME =
  '2.16.0_AddUniversalIdentifierAndApplicationIdToSearchFieldMetadataFastInstanceCommand_1782200000000';
