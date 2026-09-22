// Determines whether a logic function's prebuilt bundle is ready to install:
// it must be in PREBUILT mode, built, and have a checksum.

import { isNonEmptyString } from '@sniptt/guards';

import { LogicFunctionExecutionMode } from 'src/engine/metadata-modules/logic-function/logic-function.entity';
import { type FlatLogicFunction } from 'src/engine/metadata-modules/logic-function/types/flat-logic-function.type';

export type LogicFunctionPrebuiltStateFields = Pick<
  FlatLogicFunction,
  'executionMode' | 'isBuildUpToDate' | 'checksum'
>;

// True when executionMode is PREBUILT, the build is up to date, and a
// checksum is present.
export const isLogicFunctionReadyForPrebuiltInstall = (
  flatLogicFunction: LogicFunctionPrebuiltStateFields,
): boolean =>
  flatLogicFunction.executionMode === LogicFunctionExecutionMode.PREBUILT &&
  flatLogicFunction.isBuildUpToDate === true &&
  isNonEmptyString(flatLogicFunction.checksum);
