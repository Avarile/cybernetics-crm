// Central registry of configured AI providers/models: builds and caches
// LanguageModel instances and their cost/capability config from provider
// config, refreshing automatically when relevant config changes, and
// enforces admin/workspace availability rules.
import { Injectable, Logger } from '@nestjs/common';

import { type LanguageModel } from 'ai';
import { type AiSdkPackage } from 'twenty-shared/ai';

import { ConfigVariablesGroup } from 'src/engine/core-modules/twenty-config/enums/config-variables-group.enum';
import { ConfigGroupHashService } from 'src/engine/core-modules/twenty-config/services/config-group-hash.service';
import { AiModelRole } from 'src/engine/metadata-modules/ai/ai-models/types/ai-model-role.enum';

import {
  AiException,
  AiExceptionCode,
} from 'src/engine/metadata-modules/ai/ai.exception';
import { AiModelPreferencesService } from 'src/engine/metadata-modules/ai/ai-models/services/ai-model-preferences.service';
import { ProviderConfigService } from 'src/engine/metadata-modules/ai/ai-models/services/provider-config.service';
import { SdkProviderFactoryService } from 'src/engine/metadata-modules/ai/ai-models/services/sdk-provider-factory.service';
import { type AiModelConfig } from 'src/engine/metadata-modules/ai/ai-models/types/ai-model-config.type';
import { type AiProviderConfig } from 'src/engine/metadata-modules/ai/ai-models/types/ai-provider-config.type';
import { type AiProviderModelConfig } from 'src/engine/metadata-modules/ai/ai-models/types/ai-provider-model-config.type';
import { type AiProvidersConfig } from 'src/engine/metadata-modules/ai/ai-models/types/ai-providers-config.type';
import { DEFAULT_CONTEXT_WINDOW_TOKENS } from 'src/engine/metadata-modules/ai/ai-models/types/default-context-window-tokens.const';
import {
  AUTO_SELECT_FAST_MODEL_ID,
  AUTO_SELECT_SMART_MODEL_ID,
} from 'twenty-shared/constants';
import { isAutoSelectModelId } from 'twenty-shared/utils';

import { DEFAULT_MAX_OUTPUT_TOKENS } from 'src/engine/metadata-modules/ai/ai-models/types/default-max-output-tokens.const';
import { buildCompositeModelId } from 'src/engine/metadata-modules/ai/ai-models/utils/composite-model-id.util';
import { inferModelFamily } from 'src/engine/metadata-modules/ai/ai-models/utils/infer-model-family.util';
import { isProviderConfigured } from 'src/engine/metadata-modules/ai/ai-models/utils/is-provider-configured.util';
import {
  isModelAllowedByWorkspace,
  type WorkspaceModelAvailabilitySettings,
} from 'src/engine/metadata-modules/ai/ai-models/utils/is-model-allowed.util';
import { workspaceHasEnabledModels } from 'src/engine/metadata-modules/ai/ai-models/utils/workspace-has-enabled-models.util';

export interface RegisteredAiModel {
  modelId: string;
  sdkPackage: AiSdkPackage;
  model: LanguageModel;
  supportsReasoning?: boolean;
  providerName?: string;
  modelsDevName?: string;
}

@Injectable()
export class AiModelRegistryService {
  private readonly logger = new Logger(AiModelRegistryService.name);
  private modelRegistry: Map<string, RegisteredAiModel> = new Map();
  private modelConfigCache: Map<string, AiModelConfig> = new Map();
  private providerModelDefCache: Map<
    string,
    { providerName: string; modelDef: AiProviderModelConfig }
  > = new Map();
  private currentConfigHash: string | null = null;

  constructor(
    private readonly providerConfigService: ProviderConfigService,
    private readonly sdkProviderFactory: SdkProviderFactoryService,
    private readonly preferencesService: AiModelPreferencesService,
    private readonly configGroupHashService: ConfigGroupHashService,
  ) {}

  // The registry is rebuilt lazily whenever the LLM-group config hash changes,
  // so any mutation to an LLM-tagged config variable is picked up automatically
  // on the next read — no explicit refresh from callers needed.
  private ensureFresh(): void {
    const configHash = this.configGroupHashService.computeHash(
      ConfigVariablesGroup.LLM,
    );

    if (configHash === this.currentConfigHash) {
      return;
    }

    this.buildModelRegistry();
    this.currentConfigHash = configHash;
  }

  // Clears all caches and rebuilds the model registry from resolved provider config.
  private buildModelRegistry(): void {
    this.modelRegistry.clear();
    this.sdkProviderFactory.clearCache();
    this.modelConfigCache.clear();
    this.providerModelDefCache.clear();

    const providers = this.providerConfigService.getResolvedProviders();

    this.registerModelsFromProviders(providers);
  }

  // Populates the config/registry caches for every model of every configured
  // provider; only providers with credentials get a live SDK model instance.
  private registerModelsFromProviders(providers: AiProvidersConfig): void {
    for (const [providerKey, config] of Object.entries(providers)) {
      if (!config.npm) {
        this.logger.warn(
          `Skipping provider "${providerKey}": missing npm field`,
        );
        continue;
      }

      const models = config.models ?? [];

      if (models.length === 0) {
        continue;
      }

      const sdkInstance = isProviderConfigured(config)
        ? this.sdkProviderFactory.createProvider(providerKey, config)
        : undefined;

      for (const modelDef of models) {
        const compositeId = buildCompositeModelId(providerKey, modelDef.name);

        this.modelConfigCache.set(
          compositeId,
          this.toAiModelConfig(compositeId, config, modelDef),
        );

        this.providerModelDefCache.set(compositeId, {
          providerName: providerKey,
          modelDef,
        });

        if (sdkInstance) {
          this.modelRegistry.set(compositeId, {
            modelId: compositeId,
            sdkPackage: config.npm,
            model: sdkInstance.createModel(modelDef.name),
            supportsReasoning: modelDef.supportsReasoning,
            providerName: providerKey,
            modelsDevName: config.name,
          });
        }
      }
    }
  }

  // Converts a provider's model definition into the normalized AiModelConfig
  // used for cost calculation and capability checks.
  private toAiModelConfig(
    compositeId: string,
    providerConfig: AiProviderConfig,
    modelDef: AiProviderModelConfig,
  ): AiModelConfig {
    return {
      modelId: compositeId,
      label: modelDef.label,
      sdkPackage: providerConfig.npm,
      description: modelDef.description ?? compositeId,
      modelFamily:
        modelDef.modelFamily ??
        inferModelFamily(providerConfig.name ?? '', modelDef.name),
      dataResidency: providerConfig.dataResidency,
      inputCostPerMillionTokens: modelDef.inputCostPerMillionTokens ?? 0,
      outputCostPerMillionTokens: modelDef.outputCostPerMillionTokens ?? 0,
      cachedInputCostPerMillionTokens: modelDef.cachedInputCostPerMillionTokens,
      cacheCreationCostPerMillionTokens:
        modelDef.cacheCreationCostPerMillionTokens,
      longContextCost: modelDef.longContextCost,
      contextWindowTokens:
        modelDef.contextWindowTokens ?? DEFAULT_CONTEXT_WINDOW_TOKENS,
      maxOutputTokens: modelDef.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
      modalities: modelDef.modalities,
      supportsReasoning: modelDef.supportsReasoning,
      isDeprecated: modelDef.isDeprecated,
    };
  }

  // Looks up a registered (SDK-backed) model by composite id.
  getModel(modelId: string): RegisteredAiModel | undefined {
    this.ensureFresh();

    return this.modelRegistry.get(modelId);
  }

  // Lists all currently registered (SDK-backed) models.
  getAvailableModels(): RegisteredAiModel[] {
    this.ensureFresh();

    return Array.from(this.modelRegistry.values());
  }

  // Looks up a model's normalized config (cost/capabilities) by composite id.
  getModelConfig(modelId: string): AiModelConfig | undefined {
    this.ensureFresh();

    return this.modelConfigCache.get(modelId);
  }

  // Delegates to preferences for the recommended model id set.
  getRecommendedModelIds(): Set<string> {
    return this.preferencesService.getRecommendedModelIds();
  }

  // Returns the first model from the list that is actually registered.
  private getFirstAvailableModelFromList(
    modelIds: string[],
  ): RegisteredAiModel | undefined {
    for (const modelId of modelIds) {
      const model = this.getModel(modelId);

      if (model) {
        return model;
      }
    }

    return undefined;
  }

  // Default model for low-latency/cheap operations (e.g. title generation).
  getDefaultSpeedModel(): RegisteredAiModel {
    return this.getDefaultModelForRole(AiModelRole.FAST);
  }

  // Default model for higher-quality/capability operations.
  getDefaultPerformanceModel(): RegisteredAiModel {
    return this.getDefaultModelForRole(AiModelRole.SMART);
  }

  // Resolves the preferred model for a role, falling back to the first
  // available model, and throwing if none are configured at all.
  private getDefaultModelForRole(role: AiModelRole): RegisteredAiModel {
    const prefs = this.preferencesService.getPreferences();
    const preferenceKey =
      role === AiModelRole.FAST ? 'defaultFastModels' : 'defaultSmartModels';

    let model = this.getFirstAvailableModelFromList(prefs[preferenceKey] ?? []);

    if (!model) {
      model = this.getAvailableModels()[0];
    }

    if (!model) {
      throw new AiException(
        'No AI models are available. Configure at least one AI provider.',
        AiExceptionCode.API_KEY_NOT_CONFIGURED,
      );
    }

    return model;
  }

  // Resolves a model id (including auto-select sentinels) to its config,
  // synthesizing a default config for models not in the static catalog.
  getEffectiveModelConfig(modelId: string): AiModelConfig {
    this.ensureFresh();

    if (isAutoSelectModelId(modelId)) {
      const defaultModel =
        modelId === AUTO_SELECT_FAST_MODEL_ID
          ? this.getDefaultSpeedModel()
          : this.getDefaultPerformanceModel();

      return (
        this.modelConfigCache.get(defaultModel.modelId) ??
        this.createDefaultConfigForCustomModel(defaultModel)
      );
    }

    const config = this.modelConfigCache.get(modelId);

    if (config) {
      return config;
    }

    const registeredModel = this.getModel(modelId);

    if (registeredModel) {
      return this.createDefaultConfigForCustomModel(registeredModel);
    }

    throw new AiException(
      `Model with ID ${modelId} not found`,
      AiExceptionCode.AGENT_EXECUTION_FAILED,
    );
  }

  // Builds a minimal AiModelConfig (zero cost, default limits) for a
  // registered model that has no entry in the static provider catalog.
  private createDefaultConfigForCustomModel(
    registeredModel: RegisteredAiModel,
  ): AiModelConfig {
    return {
      modelId: registeredModel.modelId,
      label: registeredModel.modelId,
      description: `Custom model: ${registeredModel.modelId}`,
      modelFamily: inferModelFamily(
        registeredModel.modelsDevName ?? '',
        registeredModel.modelId,
      ),
      sdkPackage: registeredModel.sdkPackage,
      inputCostPerMillionTokens: 0,
      outputCostPerMillionTokens: 0,
      contextWindowTokens: DEFAULT_CONTEXT_WINDOW_TOKENS,
      maxOutputTokens: DEFAULT_MAX_OUTPUT_TOKENS,
    };
  }

  // True unless the model has been explicitly disabled by an admin (auto-select is always allowed).
  isModelAdminAllowed(modelId: string): boolean {
    if (isAutoSelectModelId(modelId)) {
      return true;
    }

    const prefs = this.preferencesService.getPreferences();
    const disabledModels = prefs.disabledModels ?? [];

    return !disabledModels.includes(modelId);
  }

  // Throws if the model is admin-disabled or not available to the given
  // workspace's model availability settings.
  validateModelAvailability(
    modelId: string,
    availabilitySettings: WorkspaceModelAvailabilitySettings,
  ): void {
    if (!this.isModelAdminAllowed(modelId)) {
      throw new AiException(
        'The selected model has been disabled by the administrator.',
        AiExceptionCode.AGENT_EXECUTION_FAILED,
      );
    }

    const recommendedModelIds = this.getRecommendedModelIds();

    const isAvailable = isAutoSelectModelId(modelId)
      ? workspaceHasEnabledModels(availabilitySettings, recommendedModelIds)
      : isModelAllowedByWorkspace(
          modelId,
          availabilitySettings,
          recommendedModelIds,
        );

    if (!isAvailable) {
      throw new AiException(
        'The selected model is not available in this workspace.',
        AiExceptionCode.AGENT_EXECUTION_FAILED,
      );
    }
  }

  // Lists registered models excluding those admin-disabled.
  getAdminFilteredModels(): RegisteredAiModel[] {
    return this.getAvailableModels().filter((model) =>
      this.isModelAdminAllowed(model.modelId),
    );
  }

  // Lists every catalog model (registered or not) with its availability,
  // admin-enabled, and recommended status, for the admin settings UI.
  getAllModelsWithStatus(): Array<{
    modelConfig: AiModelConfig;
    isAvailable: boolean;
    isAdminEnabled: boolean;
    isRecommended: boolean;
    providerName?: string;
    name?: string;
  }> {
    this.ensureFresh();
    const recommended = this.getRecommendedModelIds();

    return Array.from(this.modelConfigCache.values()).map((modelConfig) => {
      const registered = this.modelRegistry.get(modelConfig.modelId);
      const cached = this.providerModelDefCache.get(modelConfig.modelId);

      return {
        modelConfig,
        isAvailable: !!registered,
        isAdminEnabled: this.isModelAdminAllowed(modelConfig.modelId),
        isRecommended: recommended.has(modelConfig.modelId),
        providerName: registered?.providerName ?? cached?.providerName,
        name: cached?.modelDef.name,
      };
    });
  }

  // Validates the model exists, then delegates to preferences to enable/disable it.
  async setModelAdminEnabled(modelId: string, enabled: boolean): Promise<void> {
    this.validateModelInRegistry(modelId);
    await this.preferencesService.setModelAdminEnabled(modelId, enabled);
  }

  // Validates the model exists, then delegates to preferences to mark it recommended.
  async setModelRecommended(
    modelId: string,
    recommended: boolean,
  ): Promise<void> {
    this.validateModelInRegistry(modelId);
    await this.preferencesService.setModelRecommended(modelId, recommended);
  }

  // Validates each model exists, then delegates to preferences for a bulk enable/disable.
  async setModelsAdminEnabled(
    modelIds: string[],
    enabled: boolean,
  ): Promise<void> {
    modelIds.forEach((id) => this.validateModelInRegistry(id));
    await this.preferencesService.setModelsAdminEnabled(modelIds, enabled);
  }

  // Validates each model exists, then delegates to preferences for a bulk recommend update.
  async setModelsRecommended(
    modelIds: string[],
    recommended: boolean,
  ): Promise<void> {
    modelIds.forEach((id) => this.validateModelInRegistry(id));
    await this.preferencesService.setModelsRecommended(modelIds, recommended);
  }

  // Validates the model exists, then delegates to preferences to set it as the role's default.
  async setDefaultModel(role: AiModelRole, modelId: string): Promise<void> {
    this.validateModelInRegistry(modelId);
    await this.preferencesService.setDefaultModel(role, modelId);
  }

  // Throws if the model id has no entry in the provider catalog.
  private validateModelInRegistry(modelId: string): void {
    this.ensureFresh();

    if (!this.providerModelDefCache.has(modelId)) {
      throw new AiException(
        `Cannot update model "${modelId}": not found in registry`,
        AiExceptionCode.AGENT_EXECUTION_FAILED,
      );
    }
  }

  // Delegates to provider config for the full resolved provider list (admin view).
  getResolvedProvidersForAdmin(): AiProvidersConfig {
    return this.providerConfigService.getResolvedProviders();
  }

  // Delegates to provider config for the set of known catalog provider names.
  getCatalogProviderNames(): Set<string> {
    return this.providerConfigService.getCatalogProviderNames();
  }

  // Resolves an agent's configured model (or the smart default if none/auto)
  // to a registered model, throwing if its provider isn't configured.
  resolveModelForAgent(agent: { modelId: string } | null): RegisteredAiModel {
    const aiModel = this.getEffectiveModelConfig(
      agent?.modelId ?? AUTO_SELECT_SMART_MODEL_ID,
    );

    const registeredModel = this.getModel(aiModel.modelId);

    if (!registeredModel) {
      throw new AiException(
        `Model ${aiModel.modelId} not found in registry. Check that the corresponding AI provider is configured.`,
        AiExceptionCode.API_KEY_NOT_CONFIGURED,
      );
    }

    return registeredModel;
  }
}
