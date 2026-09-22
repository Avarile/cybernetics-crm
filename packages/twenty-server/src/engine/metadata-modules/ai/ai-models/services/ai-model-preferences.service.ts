// Reads and updates admin-configured AI model preferences (default fast/smart
// models, recommended/disabled model lists) stored as config variables.
import { Injectable } from '@nestjs/common';

import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { type AiModelPreferences } from 'src/engine/metadata-modules/ai/ai-models/types/ai-model-preferences.type';
import { AiModelRole } from 'src/engine/metadata-modules/ai/ai-models/types/ai-model-role.enum';

@Injectable()
export class AiModelPreferencesService {
  constructor(private readonly twentyConfigService: TwentyConfigService) {}

  // Reads the current model preferences from config.
  getPreferences(): AiModelPreferences {
    return {
      defaultFastModels: this.twentyConfigService.get('AI_MODELS_DEFAULT_FAST'),
      defaultSmartModels: this.twentyConfigService.get(
        'AI_MODELS_DEFAULT_SMART',
      ),
      recommendedModels: this.twentyConfigService.get(
        'AI_MODELS_DEFAULT_RECOMMENDED',
      ),
      disabledModels: this.twentyConfigService.get(
        'AI_MODELS_DEFAULT_DISABLED',
      ),
    };
  }

  // Returns the set of model ids marked as recommended.
  getRecommendedModelIds(): Set<string> {
    return new Set(this.getPreferences().recommendedModels ?? []);
  }

  // Enables or disables a single model workspace-wide.
  async setModelAdminEnabled(modelId: string, enabled: boolean): Promise<void> {
    await this.togglePreferenceList(modelId, 'disabledModels', !enabled);
  }

  // Marks or unmarks a single model as recommended.
  async setModelRecommended(
    modelId: string,
    recommended: boolean,
  ): Promise<void> {
    await this.togglePreferenceList(modelId, 'recommendedModels', recommended);
  }

  // Enables or disables several models workspace-wide in one update.
  async setModelsAdminEnabled(
    modelIds: string[],
    enabled: boolean,
  ): Promise<void> {
    await this.togglePreferenceListBulk(modelIds, 'disabledModels', !enabled);
  }

  // Marks or unmarks several models as recommended in one update.
  async setModelsRecommended(
    modelIds: string[],
    recommended: boolean,
  ): Promise<void> {
    await this.togglePreferenceListBulk(
      modelIds,
      'recommendedModels',
      recommended,
    );
  }

  // Sets a model as the default for a role (fast/smart), moving it to the front of that list.
  async setDefaultModel(role: AiModelRole, modelId: string): Promise<void> {
    const prefs = { ...this.getPreferences() };
    const key =
      role === AiModelRole.FAST ? 'defaultFastModels' : 'defaultSmartModels';

    const current = prefs[key] ?? [];

    prefs[key] = [modelId, ...current.filter((id) => id !== modelId)];

    await this.persistPreferences(prefs);
  }

  // Adds or removes a single model id from a preference list.
  private async togglePreferenceList(
    modelId: string,
    key: 'disabledModels' | 'recommendedModels',
    add: boolean,
  ): Promise<void> {
    await this.togglePreferenceListBulk([modelId], key, add);
  }

  // Adds or removes several model ids from a preference list in one update.
  private async togglePreferenceListBulk(
    modelIds: string[],
    key: 'disabledModels' | 'recommendedModels',
    add: boolean,
  ): Promise<void> {
    const prefs = { ...this.getPreferences() };
    const current = prefs[key] ?? [];
    const idSet = new Set(modelIds);

    if (add) {
      const existing = new Set(current);

      prefs[key] = [...current, ...modelIds.filter((id) => !existing.has(id))];
    } else {
      prefs[key] = current.filter((id) => !idSet.has(id));
    }

    await this.persistPreferences(prefs);
  }

  // Writes all four preference lists back to config.
  private async persistPreferences(prefs: AiModelPreferences): Promise<void> {
    await Promise.all([
      this.twentyConfigService.set(
        'AI_MODELS_DEFAULT_FAST',
        prefs.defaultFastModels ?? [],
      ),
      this.twentyConfigService.set(
        'AI_MODELS_DEFAULT_SMART',
        prefs.defaultSmartModels ?? [],
      ),
      this.twentyConfigService.set(
        'AI_MODELS_DEFAULT_RECOMMENDED',
        prefs.recommendedModels ?? [],
      ),
      this.twentyConfigService.set(
        'AI_MODELS_DEFAULT_DISABLED',
        prefs.disabledModels ?? [],
      ),
    ]);
  }
}
