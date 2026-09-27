// Phantom brand (never actually present at runtime) applied to an entity's jsonb-typed
// column definitions so ExtractJsonbProperties can find them at compile time. This only
// tells the type system WHICH properties are jsonb-shaped, not which of those embed a
// serialized relation — that still has to be listed by hand (see
// ALL_JSONB_PROPERTIES_WITH_SERIALIZED_RELATION_BY_METADATA_NAME's "satisfies" clause,
// which uses ExtractJsonbProperties to at least constrain the map to real jsonb keys).
export const JSONB_PROPERTY_BRAND = '__JsonbPropertyBrand__' as const;

export type JsonbProperty<T> = T extends unknown
  ? T extends object
    ? T & { [JSONB_PROPERTY_BRAND]?: never }
    : T
  : never;
