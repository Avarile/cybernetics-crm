import { type NativeModelToolKey } from 'src/engine/metadata-modules/ai/ai-models/types/native-model-tool-key.type';

// Per-SDK-package declaration of which native tools exist and their direct tool name.
export type NativeModelTools = Partial<
  Record<
    NativeModelToolKey,
    {
      kind: 'sdk-tool';
      directToolName: string;
    }
  >
>;
