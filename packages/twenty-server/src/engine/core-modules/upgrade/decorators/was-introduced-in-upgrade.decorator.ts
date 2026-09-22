import 'reflect-metadata';

import { defineUpgradeMetadataOnClassOrProperty } from 'src/engine/core-modules/upgrade/decorators/upgrade-decorator-metadata.util';

export type WasIntroducedInUpgradeOptions = {
  upgradeCommandName: string;
};

export const WAS_INTRODUCED_IN_UPGRADE_CLASS_METADATA_KEY =
  'WAS_INTRODUCED_IN_UPGRADE_CLASS';

export const WAS_INTRODUCED_IN_UPGRADE_PROPERTIES_METADATA_KEY =
  'WAS_INTRODUCED_IN_UPGRADE_PROPERTIES';

export type WasIntroducedInUpgradePropertyMap = Record<
  string,
  WasIntroducedInUpgradeOptions
>;

// Class/property decorator recording which upgrade command introduced this
// entity or field, so upgrade-aware entity shape resolution can account for it
export const WasIntroducedInUpgrade =
  (options: WasIntroducedInUpgradeOptions) =>
  (target: object, propertyKey?: string | symbol): void => {
    defineUpgradeMetadataOnClassOrProperty({
      classMetadataKey: WAS_INTRODUCED_IN_UPGRADE_CLASS_METADATA_KEY,
      propertyMetadataKey: WAS_INTRODUCED_IN_UPGRADE_PROPERTIES_METADATA_KEY,
      value: options,
      target,
      propertyKey,
    });
  };

// Reads the class-level @WasIntroducedInUpgrade metadata, if present
export const getWasIntroducedInUpgradeClassMetadata = (
  target: Function,
): WasIntroducedInUpgradeOptions | undefined =>
  Reflect.getMetadata(WAS_INTRODUCED_IN_UPGRADE_CLASS_METADATA_KEY, target);

// Reads the per-property @WasIntroducedInUpgrade metadata map for a class
export const getWasIntroducedInUpgradePropertyMetadata = (
  target: Function,
): WasIntroducedInUpgradePropertyMap =>
  Reflect.getMetadata(
    WAS_INTRODUCED_IN_UPGRADE_PROPERTIES_METADATA_KEY,
    target,
  ) ?? {};
