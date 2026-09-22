// Types describing the unique-index-derived fields used to detect
// conflicting (pre-existing) records during an upsert createMany.
export type ConflictingFieldValue = string | number | boolean;

export type ConflictingProperty = {
  fullPath: string;
  column: string;
};

export type ConflictingFieldGroup = {
  baseFields: string[];
  conflictingProperties: ConflictingProperty[];
};
