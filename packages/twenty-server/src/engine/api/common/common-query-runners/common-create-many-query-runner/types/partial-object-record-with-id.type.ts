import { type ObjectRecord } from 'twenty-shared/types';

// A partial record that's guaranteed to carry its id, e.g. a record about
// to be updated during an upsert.
export type PartialObjectRecordWithId = Partial<ObjectRecord> & { id: string };
