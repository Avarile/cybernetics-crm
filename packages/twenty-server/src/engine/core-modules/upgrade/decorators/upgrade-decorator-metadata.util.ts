import 'reflect-metadata';

import { isDefined } from 'twenty-shared/utils';

// Shared metadata-writing logic for the upgrade-history decorators: stores
// class-level metadata directly, or merges property-level metadata into a map
// keyed by property name on the constructor
export const defineUpgradeMetadataOnClassOrProperty = <T>({
  classMetadataKey,
  propertyMetadataKey,
  value,
  target,
  propertyKey,
}: {
  classMetadataKey: string;
  propertyMetadataKey: string;
  value: T;
  target: object;
  propertyKey: string | symbol | undefined;
}): void => {
  if (!isDefined(propertyKey)) {
    Reflect.defineMetadata(classMetadataKey, value, target);

    return;
  }

  const constructor = (target as { constructor: Function }).constructor;
  const existing: Record<string, T> =
    Reflect.getMetadata(propertyMetadataKey, constructor) ?? {};

  Reflect.defineMetadata(
    propertyMetadataKey,
    { ...existing, [String(propertyKey)]: value },
    constructor,
  );
};
