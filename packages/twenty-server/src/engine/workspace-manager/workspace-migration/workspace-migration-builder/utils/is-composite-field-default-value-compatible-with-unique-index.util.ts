import { CompositeFieldMetadataType } from 'src/engine/metadata-modules/field-metadata/types/composite-field-metadata-type.type';
import { nullifyEmptyCompositeDefaultValue } from 'src/engine/metadata-modules/flat-field-metadata/utils/nullify-empty-composite-default-value.util';
import {
  type CompositeProperty,
  type FieldMetadataDefaultValueForAnyType,
} from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';

// A non-null default value on every column of a unique composite index would make
// every existing row collide the moment a second row is created with that default
// (Postgres unique constraints reject duplicate non-null tuples, but NULLs are never
// considered equal to each other). So this only fails when the default fully specifies
// every uniquely-constrained sub-property — if at least one stays null, rows sharing
// the default remain distinct as far as the unique index is concerned.
export const isCompositeFieldDefaultValueCompatibleWithUniqueIndex = ({
  fieldType,
  compositeProperties,
  defaultValue,
}: {
  fieldType: CompositeFieldMetadataType;
  compositeProperties: CompositeProperty[];
  defaultValue?: FieldMetadataDefaultValueForAnyType;
}) => {
  if (!isDefined(defaultValue)) {
    return true;
  }

  const normalizedDefaultValue = nullifyEmptyCompositeDefaultValue({
    defaultValue,
    fieldType,
  });

  if (!isDefined(normalizedDefaultValue)) {
    return true;
  }

  const uniqueCompositeProperties = compositeProperties.filter(
    (property) => property.isIncludedInUniqueConstraint === true,
  );

  return uniqueCompositeProperties.some((compositeProperty) => {
    return !isDefined(
      normalizedDefaultValue[
        compositeProperty.name as keyof typeof normalizedDefaultValue
      ],
    );
  });
};
