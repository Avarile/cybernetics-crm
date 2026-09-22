import 'reflect-metadata';

import { defineUpgradeMetadataOnClassOrProperty } from 'src/engine/core-modules/upgrade/decorators/upgrade-decorator-metadata.util';

export type WasRemovedInUpgradeOptions = {
  upgradeCommandName: string;
};

// Type-level brand marking a field as removed in a later upgrade, so entity
// shape helpers can find and optionalize/strip these fields at compile time
declare const wasRemovedInUpgradeBrand: unique symbol;

export type WasRemovedInUpgrade<T> = T & {
  readonly [wasRemovedInUpgradeBrand]?: true;
};

// Strips the WasRemovedInUpgrade brand back to the field's underlying type
export type UnwrapWasRemovedInUpgrade<T> = [T] extends [
  WasRemovedInUpgrade<infer TUnwrapped>,
]
  ? TUnwrapped
  : T;

// Union of an entity's property names branded WasRemovedInUpgrade
type WasRemovedInUpgradeKeys<TEntity> = {
  [K in keyof TEntity]: typeof wasRemovedInUpgradeBrand extends keyof TEntity[K]
    ? K
    : never;
}[keyof TEntity];

// Makes an entity's WasRemovedInUpgrade-branded fields optional, for representing
// an entity shape at an upgrade cursor before those fields were removed
export type MakeWasRemovedInUpgradePropertiesOptional<TEntity> = Omit<
  TEntity,
  WasRemovedInUpgradeKeys<TEntity>
> &
  Partial<Pick<TEntity, WasRemovedInUpgradeKeys<TEntity>>>;

export const WAS_REMOVED_IN_UPGRADE_CLASS_METADATA_KEY =
  'WAS_REMOVED_IN_UPGRADE_CLASS';

export const WAS_REMOVED_IN_UPGRADE_PROPERTIES_METADATA_KEY =
  'WAS_REMOVED_IN_UPGRADE_PROPERTIES';

export type WasRemovedInUpgradePropertyMap = Record<
  string,
  WasRemovedInUpgradeOptions
>;

// Class/property decorator recording which upgrade command removed this
// entity or field
export const WasRemovedInUpgrade =
  (options: WasRemovedInUpgradeOptions) =>
  (target: object, propertyKey?: string | symbol): void => {
    defineUpgradeMetadataOnClassOrProperty({
      classMetadataKey: WAS_REMOVED_IN_UPGRADE_CLASS_METADATA_KEY,
      propertyMetadataKey: WAS_REMOVED_IN_UPGRADE_PROPERTIES_METADATA_KEY,
      value: options,
      target,
      propertyKey,
    });
  };

// Reads the class-level @WasRemovedInUpgrade metadata, if present
export const getWasRemovedInUpgradeClassMetadata = (
  target: Function,
): WasRemovedInUpgradeOptions | undefined =>
  Reflect.getMetadata(WAS_REMOVED_IN_UPGRADE_CLASS_METADATA_KEY, target);

// Reads the per-property @WasRemovedInUpgrade metadata map for a class
export const getWasRemovedInUpgradePropertyMetadata = (
  target: Function,
): WasRemovedInUpgradePropertyMap =>
  Reflect.getMetadata(WAS_REMOVED_IN_UPGRADE_PROPERTIES_METADATA_KEY, target) ??
  {};
