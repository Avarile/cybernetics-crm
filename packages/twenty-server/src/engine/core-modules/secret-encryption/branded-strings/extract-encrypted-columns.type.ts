import { type ContainsEncryptedString } from 'src/engine/core-modules/secret-encryption/branded-strings/contains-encrypted-string.type';
import { type ExtractEntityRelatedEntityProperties } from 'src/engine/metadata-modules/flat-entity/types/extract-entity-related-entity-properties.type';

// Unions the property names of T whose value type contains an EncryptedString
type ExtractEncryptedColumnsFromShape<T> = NonNullable<
  {
    [P in keyof T]-?: true extends ContainsEncryptedString<NonNullable<T[P]>>
      ? P
      : never;
  }[keyof T]
>;

// Names of an entity's own columns (excluding relations) that hold encrypted values
export type ExtractEncryptedColumns<T> = ExtractEncryptedColumnsFromShape<
  Omit<T, ExtractEntityRelatedEntityProperties<T>>
>;
