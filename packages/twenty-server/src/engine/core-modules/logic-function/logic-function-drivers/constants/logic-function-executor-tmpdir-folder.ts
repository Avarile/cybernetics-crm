import { join } from 'path';
import { tmpdir } from 'os';

// Scratch directory used to build and execute logic functions before cleanup
export const LOGIC_FUNCTION_EXECUTOR_TMPDIR_FOLDER = join(
  tmpdir(),
  'logic-function-executor-tmpdir',
);
