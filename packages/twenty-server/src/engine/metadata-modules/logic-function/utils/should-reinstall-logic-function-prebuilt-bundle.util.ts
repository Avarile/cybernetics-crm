// Decides whether a prebuilt bundle install/reinstall is needed: skip if the
// new function isn't ready, or if it's already installed with the same checksum.

import { LogicFunctionExecutionMode } from 'src/engine/metadata-modules/logic-function/logic-function.entity';
import {
  isLogicFunctionReadyForPrebuiltInstall,
  type LogicFunctionPrebuiltStateFields,
} from 'src/engine/metadata-modules/logic-function/utils/is-logic-function-ready-for-prebuilt-install.util';

// Returns false if the new function isn't prebuilt-ready, or if the
// existing function is already the same prebuilt checksum; true otherwise.
export const shouldReinstallLogicFunctionPrebuiltBundle = ({
  existingLogicFunction,
  newLogicFunction,
}: {
  existingLogicFunction: LogicFunctionPrebuiltStateFields;
  newLogicFunction: LogicFunctionPrebuiltStateFields;
}): boolean => {
  if (!isLogicFunctionReadyForPrebuiltInstall(newLogicFunction)) {
    return false;
  }

  if (
    existingLogicFunction.executionMode ===
      LogicFunctionExecutionMode.PREBUILT &&
    existingLogicFunction.checksum === newLogicFunction.checksum
  ) {
    return false;
  }

  return true;
};
