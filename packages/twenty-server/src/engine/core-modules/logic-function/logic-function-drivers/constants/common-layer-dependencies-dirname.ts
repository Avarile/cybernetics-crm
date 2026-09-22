import path from 'path';

import { ASSET_PATH } from 'src/constants/assets-path';

// Absolute path to the shared node_modules dependencies bundled into every logic function's Lambda layer
export const COMMON_LAYER_DEPENDENCIES_DIRNAME = path.resolve(
  __dirname,
  path.join(
    ASSET_PATH,
    'engine/core-modules/logic-function/logic-function-drivers/constants/common-layer-dependencies',
  ),
);
