// Absolute path to the bundled seed node_modules used when building a
// logic function layer's dependencies.
import path from 'path';

import { ASSET_PATH } from 'src/constants/assets-path';

export const SEED_DEPENDENCIES_DIRNAME = path.resolve(
  __dirname,
  path.join(
    ASSET_PATH,
    'engine/core-modules/application/application-package/constants/seed-dependencies',
  ),
);
