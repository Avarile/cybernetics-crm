import { type FormatRecordSerializedRelationProperties } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

import {
  FlatEntityMapsException,
  FlatEntityMapsExceptionCode,
} from 'src/engine/metadata-modules/flat-entity/exceptions/flat-entity-maps.exception';
import { type ViewFieldOverrides } from 'src/engine/metadata-modules/view-field/entities/view-field.entity';

// Overrides shape with the viewFieldGroupId foreign key replaced by its
// universal-identifier equivalent, portable across workspace migrations.
type UniversalViewFieldOverrides =
  FormatRecordSerializedRelationProperties<ViewFieldOverrides>;

// Converts a view field's overrides blob to its universal form by
// replacing a viewFieldGroupId override with the matching group's
// universal identifier (or null if missing, unless configured to throw).
export const fromViewFieldOverridesToUniversalOverrides = ({
  overrides,
  viewFieldGroupUniversalIdentifierById,
  shouldThrowOnMissingIdentifier = true,
}: {
  overrides: ViewFieldOverrides;
  viewFieldGroupUniversalIdentifierById: Partial<Record<string, string>>;
  shouldThrowOnMissingIdentifier?: boolean;
}): UniversalViewFieldOverrides => {
  const { viewFieldGroupId, ...scalarOverrides } = overrides;

  if (!isDefined(viewFieldGroupId)) {
    return {
      ...scalarOverrides,
      ...(viewFieldGroupId === null
        ? { viewFieldGroupUniversalIdentifier: null }
        : {}),
    };
  }

  const viewFieldGroupUniversalIdentifier =
    viewFieldGroupUniversalIdentifierById[viewFieldGroupId];

  if (!isDefined(viewFieldGroupUniversalIdentifier)) {
    if (shouldThrowOnMissingIdentifier) {
      throw new FlatEntityMapsException(
        `ViewFieldGroup universal identifier not found for id: ${viewFieldGroupId}`,
        FlatEntityMapsExceptionCode.RELATION_UNIVERSAL_IDENTIFIER_NOT_FOUND,
      );
    }

    return {
      ...scalarOverrides,
      viewFieldGroupUniversalIdentifier: null,
    };
  }

  return {
    ...scalarOverrides,
    viewFieldGroupUniversalIdentifier,
  };
};
