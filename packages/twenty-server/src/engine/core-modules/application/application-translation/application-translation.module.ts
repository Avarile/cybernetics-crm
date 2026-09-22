// Wires the services that cache and sync an application's translated
// message catalogs.
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApplicationTranslationCacheService } from 'src/engine/core-modules/application/application-translation/application-translation-cache.service';
import { ApplicationTranslationSyncService } from 'src/engine/core-modules/application/application-translation/application-translation-sync.service';
import { ApplicationTranslationEntity } from 'src/engine/core-modules/application/application-translation/application-translation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApplicationTranslationEntity])],
  providers: [
    ApplicationTranslationCacheService,
    ApplicationTranslationSyncService,
  ],
  exports: [
    ApplicationTranslationCacheService,
    ApplicationTranslationSyncService,
  ],
})
export class ApplicationTranslationModule {}
