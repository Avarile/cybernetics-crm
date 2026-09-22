import { type FormatRecordSerializedRelationProperties } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import {
  FlatEntityMapsException,
  FlatEntityMapsExceptionCode,
} from 'src/engine/metadata-modules/flat-entity/exceptions/flat-entity-maps.exception';
import { type ViewOverrides } from 'src/engine/metadata-modules/view/entities/view.entity';

// Overrides shape with field metadata foreign-key properties replaced by
// their universal-identifier equivalents, portable across migrations.
type UniversalViewOverrides =
  FormatRecordSerializedRelationProperties<ViewOverrides>;

// View override properties that reference field metadata by id and need
// translation to universal identifiers.
const VIEW_OVERRIDES_FIELD_METADATA_FOREIGN_KEYS = [
  'kanbanAggregateOperationFieldMetadataId',
  'calendarFieldMetadataId',
  'calendarEndFieldMetadataId',
  'mainGroupByFieldMetadataId',
] as const;

type ViewOverridesFieldMetadataForeignKey =
  (typeof VIEW_OVERRIDES_FIELD_METADATA_FOREIGN_KEYS)[number];

// Derives the universal-identifier property name from a foreign key
// property name (e.g. "calendarFieldMetadataId" -> "...UniversalIdentifier").
const toUniversalIdentifierProperty = (
  foreignKey: ViewOverridesFieldMetadataForeignKey,
) =>
  foreignKey.replace(
    /Id$/,
    'UniversalIdentifier',
  ) as keyof UniversalViewOverrides;

// Converts a view's overrides blob to its universal form by replacing
// each field-metadata foreign-key override with the matching field's
// universal identifier (or null if missing, unless configured to throw).
export const fromViewOverridesToUniversalOverrides = ({
  overrides,
  fieldMetadataUniversalIdentifierById,
  shouldThrowOnMissingIdentifier = true,
}: {
  overrides: ViewOverrides;
  fieldMetadataUniversalIdentifierById: Partial<Record<string, string>>;
  shouldThrowOnMissingIdentifier?: boolean;
}): UniversalViewOverrides => {
  const {
    kanbanAggregateOperationFieldMetadataId: _kanban,
    calendarFieldMetadataId: _calendar,
    calendarEndFieldMetadataId: _calendarEnd,
    mainGroupByFieldMetadataId: _mainGroupBy,
    ...scalarOverrides
  } = overrides;

  return VIEW_OVERRIDES_FIELD_METADATA_FOREIGN_KEYS.reduce<UniversalViewOverrides>(
    (acc, foreignKey) => {
      const foreignKeyValue = overrides[foreignKey];

      if (foreignKeyValue === undefined) {
        return acc;
      }

      const universalIdentifierProperty =
        toUniversalIdentifierProperty(foreignKey);

      if (foreignKeyValue === null) {
        return { ...acc, [universalIdentifierProperty]: null };
      }

      const universalIdentifier =
        fieldMetadataUniversalIdentifierById[foreignKeyValue];

      if (!isDefined(universalIdentifier)) {
        if (shouldThrowOnMissingIdentifier) {
          throw new FlatEntityMapsException(
            `FieldMetadata universal identifier not found for id: ${foreignKeyValue}`,
            FlatEntityMapsExceptionCode.RELATION_UNIVERSAL_IDENTIFIER_NOT_FOUND,
          );
        }

        return { ...acc, [universalIdentifierProperty]: null };
      }

      return { ...acc, [universalIdentifierProperty]: universalIdentifier };
    },
    scalarOverrides,
  );
};
