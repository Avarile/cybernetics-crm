import { join } from 'path';

import { LOGIC_FUNCTION_EXECUTOR_TMPDIR_FOLDER } from 'src/engine/core-modules/logic-function/logic-function-drivers/constants/logic-function-executor-tmpdir-folder';

// Returns the local disk path for a workspace/application's SDK layer.
export const getLocalSdkLayerPath = ({
  workspaceId,
  applicationUniversalIdentifier,
}: {
  workspaceId: string;
  applicationUniversalIdentifier: string;
}): string =>
  join(
    LOGIC_FUNCTION_EXECUTOR_TMPDIR_FOLDER,
    'sdk',
    `${workspaceId}-${applicationUniversalIdentifier}`,
  );
