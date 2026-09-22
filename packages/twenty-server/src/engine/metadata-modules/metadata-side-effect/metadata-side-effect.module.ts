// Wires up the metadata side effect engine and its discovery-based handler
// registry, exposing the engine for other modules to trigger side effects.

import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import { MetadataSideEffectHandlersModule } from 'src/engine/metadata-modules/metadata-side-effect/handlers/metadata-side-effect-handlers.module';
import { MetadataSideEffectHandlerRegistryService } from 'src/engine/metadata-modules/metadata-side-effect/registry/metadata-side-effect-handler-registry.service';
import { MetadataSideEffectEngineService } from 'src/engine/metadata-modules/metadata-side-effect/services/metadata-side-effect-engine.service';

@Module({
  imports: [DiscoveryModule, MetadataSideEffectHandlersModule],
  providers: [
    MetadataSideEffectHandlerRegistryService,
    MetadataSideEffectEngineService,
  ],
  exports: [MetadataSideEffectEngineService],
})
// Provides the metadata side effect engine to modules that need to trigger
// side effects on metadata mutations.
export class MetadataSideEffectModule {}
