// Type-level version of the naming convention used at runtime by e.g.
// from-universal-overrides-to-view-overrides.util.ts's toForeignKeyProperty: every real
// foreign key `xId` has a universal counterpart named `xUniversalIdentifier`.
export type ToUniversalForeignKey<T extends string> =
  T extends `${infer Prefix}Id` ? `${Prefix}UniversalIdentifier` : never;
