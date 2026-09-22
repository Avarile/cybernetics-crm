import { type NativeModelToolKey } from 'src/engine/metadata-modules/ai/ai-models/types/native-model-tool-key.type';

// Which native tools should be enabled for a given model call/agent.
export type NativeModelToolOptions = Partial<
  Record<NativeModelToolKey, boolean>
>;
