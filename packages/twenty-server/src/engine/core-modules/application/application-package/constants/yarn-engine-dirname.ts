// Absolute path to the bundled Yarn engine used to install/build an
// application's dependencies in an isolated environment.
import path from 'path';

import { ASSET_PATH } from 'src/constants/assets-path';

export const YARN_ENGINE_DIRNAME = path.resolve(
  __dirname,
  path.join(
    ASSET_PATH,
    'engine/core-modules/application/application-package/constants/yarn-engine',
  ),
);
