import 'reflect-metadata';

import { defineUpgradeMetadataOnClassOrProperty } from 'src/engine/core-modules/upgrade/decorators/upgrade-decorator-metadata.util';

export type WasRenamedInUpgradeHistoryEntry = {
  previousName: string;
  upgradeCommandName: string;
};

export const WAS_RENAMED_IN_UPGRADE_CLASS_METADATA_KEY =
  'WAS_RENAMED_IN_UPGRADE_CLASS';

export const WAS_RENAMED_IN_UPGRADE_PROPERTIES_METADATA_KEY =
  'WAS_RENAMED_IN_UPGRADE_PROPERTIES';

export type WasRenamedInUpgradePropertyMap = Record<
  string,
  WasRenamedInUpgradeHistoryEntry[]
>;

// Class/property decorator recording the rename history of an entity or field
// across upgrades, so old names can still be resolved at earlier upgrade cursors
export const WasRenamedInUpgrade =
  (history: WasRenamedInUpgradeHistoryEntry[]) =>
  (target: object, propertyKey?: string | symbol): void => {
    defineUpgradeMetadataOnClassOrProperty({
      classMetadataKey: WAS_RENAMED_IN_UPGRADE_CLASS_METADATA_KEY,
      propertyMetadataKey: WAS_RENAMED_IN_UPGRADE_PROPERTIES_METADATA_KEY,
      value: history,
      target,
      propertyKey,
    });
  };

// Reads the class-level @WasRenamedInUpgrade metadata, if present
export const getWasRenamedInUpgradeClassMetadata = (
  target: Function,
): WasRenamedInUpgradeHistoryEntry[] | undefined =>
  Reflect.getMetadata(WAS_RENAMED_IN_UPGRADE_CLASS_METADATA_KEY, target);

// Reads the per-property @WasRenamedInUpgrade metadata map for a class
export const getWasRenamedInUpgradePropertyMetadata = (
  target: Function,
): WasRenamedInUpgradePropertyMap =>
  Reflect.getMetadata(WAS_RENAMED_IN_UPGRADE_PROPERTIES_METADATA_KEY, target) ??
  {};
