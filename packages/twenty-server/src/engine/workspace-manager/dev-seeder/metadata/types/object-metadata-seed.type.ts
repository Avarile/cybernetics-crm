// Object creation input for a seed object, without the ids/fields filled in
// at seed time.
import { type CreateObjectInput } from 'src/engine/metadata-modules/object-metadata/dtos/create-object.input';

export type ObjectMetadataSeed = Omit<
  CreateObjectInput,
  'workspaceId' | 'fields'
> & {
  skipNameField?: boolean;
};
