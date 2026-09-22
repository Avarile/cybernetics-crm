// Derives an object metadata name (e.g. 'person') from a workspace entity
// class name (e.g. 'PersonWorkspaceEntity').
import { camelCase } from 'src/utils/camel-case';

const classSuffix = 'WorkspaceEntity';

// Converts to camelCase and strips the trailing 'WorkspaceEntity' suffix.
export const convertClassNameToObjectMetadataName = (name: string): string => {
  let objectName = camelCase(name);

  if (objectName.endsWith(classSuffix)) {
    objectName = objectName.slice(0, -classSuffix.length);
  }

  return objectName;
};
