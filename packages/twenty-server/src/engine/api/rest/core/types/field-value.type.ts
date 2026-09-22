// Recursive JSON-like value shape used for parsed REST request field values.
export type FieldValue =
  | string
  | boolean
  | number
  | FieldValue[]
  | { [key: string]: FieldValue };
