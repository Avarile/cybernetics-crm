// Sanitizes and validates the raw update-object GraphQL input: strips
// whitespace, rejects edits to non-editable properties on standard objects,
// and splits overridable properties out into the overrides blob.

import { extractAndSanitizeObjectStringFields } from 'twenty-shared/utils';

import { ALL_OVERRIDABLE_PROPERTIES_BY_METADATA_NAME } from 'src/engine/metadata-modules/flat-entity/constant/all-overridable-properties-by-metadata-name.constant';
import { FLAT_OBJECT_METADATA_EDITABLE_PROPERTIES } from 'src/engine/metadata-modules/flat-object-metadata/constants/flat-object-metadata-editable-properties.constant';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { type UpdateOneObjectInput } from 'src/engine/metadata-modules/object-metadata/dtos/update-object.input';
import {
  ObjectMetadataException,
  ObjectMetadataExceptionCode,
} from 'src/engine/metadata-modules/object-metadata/object-metadata.exception';
import { belongsToTwentyStandardApp } from 'src/engine/metadata-modules/utils/belongs-to-twenty-standard-app.util';
import { computeMetadataOverridesBlob } from 'src/engine/metadata-modules/utils/compute-metadata-overrides-blob.util';

type SanitizeRawUpdateObjectInputArgs = {
  rawUpdateObjectInput: UpdateOneObjectInput;
  existingFlatObjectMetadata: FlatObjectMetadata;
};

// Extracts editable properties from the raw input; for standard objects,
// rejects properties outside the standard-editable allowlist and moves
// overridable properties into a separate overrides blob instead of the entity.
export const sanitizeRawUpdateObjectInput = ({
  existingFlatObjectMetadata,
  rawUpdateObjectInput,
}: SanitizeRawUpdateObjectInputArgs) => {
  const isStandardObject = belongsToTwentyStandardApp(
    existingFlatObjectMetadata,
  );
  const updatedEditableObjectProperties = extractAndSanitizeObjectStringFields(
    rawUpdateObjectInput.update,
    [
      ...new Set([
        ...FLAT_OBJECT_METADATA_EDITABLE_PROPERTIES.standard,
        ...FLAT_OBJECT_METADATA_EDITABLE_PROPERTIES.custom,
      ]),
    ],
  );

  if (!isStandardObject) {
    return {
      updatedEditableObjectProperties,
      overrides: null,
    };
  }

  const invalidUpdatedProperties = Object.keys(
    updatedEditableObjectProperties,
  ).filter(
    (property) =>
      !FLAT_OBJECT_METADATA_EDITABLE_PROPERTIES.standard.includes(
        property as (typeof FLAT_OBJECT_METADATA_EDITABLE_PROPERTIES.standard)[number],
      ),
  );

  if (invalidUpdatedProperties.length > 0) {
    throw new ObjectMetadataException(
      `Cannot edit standard object metadata properties: ${invalidUpdatedProperties.join(', ')}`,
      ObjectMetadataExceptionCode.INVALID_OBJECT_INPUT,
    );
  }

  const { overrides, remainingProperties } = computeMetadataOverridesBlob({
    overridableProperties:
      ALL_OVERRIDABLE_PROPERTIES_BY_METADATA_NAME.objectMetadata,
    updatedProperties: updatedEditableObjectProperties,
    existingEntity: existingFlatObjectMetadata,
    existingOverrides: existingFlatObjectMetadata.overrides,
  });

  return {
    overrides,
    updatedEditableObjectProperties: remainingProperties,
  };
};
