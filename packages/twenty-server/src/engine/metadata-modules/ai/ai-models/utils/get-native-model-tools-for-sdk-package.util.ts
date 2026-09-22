import { type AiSdkPackage } from 'twenty-shared/ai';

import { NATIVE_MODEL_TOOLS_BY_SDK_PACKAGE } from 'src/engine/metadata-modules/ai/ai-models/constants/native-model-tools-by-sdk-package.const';
import { type NativeModelTools } from 'src/engine/metadata-modules/ai/ai-models/types/native-model-tools.type';

// Looks up the native tool definitions declared for an SDK package.
export const getNativeModelToolsForSdkPackage = (
  sdkPackage?: AiSdkPackage | null,
): NativeModelTools | undefined =>
  sdkPackage ? NATIVE_MODEL_TOOLS_BY_SDK_PACKAGE[sdkPackage] : undefined;
