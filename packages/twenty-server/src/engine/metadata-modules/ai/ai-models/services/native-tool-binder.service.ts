// Default NativeToolBinder implementation delegating to AiModelConfigService.
import { Injectable } from '@nestjs/common';

import { type ToolSet } from 'ai';

import { AiModelConfigService } from 'src/engine/metadata-modules/ai/ai-models/services/ai-model-config.service';
import { type RegisteredAiModel } from 'src/engine/metadata-modules/ai/ai-models/services/ai-model-registry.service';
import { type NativeToolBinder } from 'src/engine/metadata-modules/ai/ai-models/services/native-tool-binder.interface';
import { type NativeModelToolOptions } from 'src/engine/metadata-modules/ai/ai-models/types/native-model-tool-options.type';

@Injectable()
export class NativeToolBinderService implements NativeToolBinder {
  constructor(private readonly aiModelConfigService: AiModelConfigService) {}

  // Resolves the model's native tools for the requested capabilities.
  bind(
    model: RegisteredAiModel,
    options: NativeModelToolOptions = {},
  ): ToolSet {
    return this.aiModelConfigService.getNativeModelTools(model, options);
  }
}
