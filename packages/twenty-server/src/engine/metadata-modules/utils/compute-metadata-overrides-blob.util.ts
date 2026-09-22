import { fastDeepEqual, isDefined } from 'twenty-shared/utils';

// Inputs for computing which overridable properties diverge from the base
// (standard) entity and should be stored as an overrides blob.
type ComputeMetadataOverridesBlobArgs<
  TProperties extends object,
  TOverrides,
> = {
  overridableProperties: readonly string[];
  updatedProperties: TProperties;
  existingEntity: object;
  existingOverrides: TOverrides | null;
};

// Splits updated properties into an overrides blob (only the overridable
// properties that differ from the existing base entity) and the remaining,
// directly-persisted properties. Removes a property from overrides once
// its updated value matches the base entity again, so overrides only ever
// capture true divergences.
export const computeMetadataOverridesBlob = <
  TProperties extends object,
  TOverrides = Record<string, unknown>,
>({
  overridableProperties,
  updatedProperties,
  existingEntity,
  existingOverrides,
}: ComputeMetadataOverridesBlobArgs<TProperties, TOverrides>): {
  overrides: TOverrides | null;
  remainingProperties: TProperties;
} => {
  const remainingRecord: Record<string, unknown> = {
    ...(updatedProperties as unknown as Record<string, unknown>),
  };
  const existingRecord = existingEntity as Record<string, unknown>;

  const overrides = overridableProperties.reduce<Record<
    string,
    unknown
  > | null>(
    (acc, property) => {
      if (remainingRecord[property] === undefined) {
        return acc;
      }

      const propertyValue = remainingRecord[property];

      delete remainingRecord[property];

      if (fastDeepEqual(propertyValue, existingRecord[property])) {
        if (
          isDefined(acc) &&
          Object.prototype.hasOwnProperty.call(acc, property)
        ) {
          const { [property]: _removedProperty, ...restOverrides } = acc;

          return restOverrides;
        }

        return acc;
      }

      return {
        ...acc,
        [property]: propertyValue,
      };
    },
    existingOverrides as unknown as Record<string, unknown> | null,
  );

  const remainingProperties = remainingRecord as unknown as TProperties;

  if (isDefined(overrides) && Object.keys(overrides).length === 0) {
    return { overrides: null, remainingProperties };
  }

  return {
    overrides: overrides as unknown as TOverrides | null,
    remainingProperties,
  };
};
