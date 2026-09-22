import { type STANDARD_OBJECTS } from 'twenty-shared/metadata';

// Union of all standard object names, derived from the shared STANDARD_OBJECTS registry
export type AllStandardObjectName = keyof typeof STANDARD_OBJECTS;
