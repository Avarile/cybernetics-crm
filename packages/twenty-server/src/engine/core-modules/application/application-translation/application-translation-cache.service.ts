// Short-TTL in-memory cache of an application's translated message
// catalogs by locale, avoiding a DB round trip on every translated string
// lookup.
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { type APP_LOCALES } from 'twenty-shared/translations';
import { Repository } from 'typeorm';

import { ApplicationTranslationEntity } from 'src/engine/core-modules/application/application-translation/application-translation.entity';
import { PromiseMemoizer } from 'src/engine/twenty-orm/storage/promise-memoizer.storage';
import { type CacheKey } from 'src/engine/twenty-orm/storage/types/cache-key.type';

type ApplicationCatalogsByLocale = Partial<
  Record<keyof typeof APP_LOCALES, Record<string, string>>
>;

const CACHE_TTL_MS = 30_000;

const EMPTY_CATALOG: Record<string, string> = {};

@Injectable()
export class ApplicationTranslationCacheService {
  private readonly catalogsMemoizer =
    new PromiseMemoizer<ApplicationCatalogsByLocale>(CACHE_TTL_MS);

  constructor(
    // applicationTranslation is a core cross-workspace table keyed by applicationRegistrationId, not workspaceId.
    // eslint-disable-next-line twenty/prefer-workspace-scoped-repository
    @InjectRepository(ApplicationTranslationEntity)
    private readonly applicationTranslationRepository: Repository<ApplicationTranslationEntity>,
  ) {}

  // Returns the cached (or freshly loaded) message catalog for an
  // application's locale, or an empty catalog if none exists.
  async getCatalog({
    applicationRegistrationId,
    locale,
  }: {
    applicationRegistrationId: string;
    locale: keyof typeof APP_LOCALES;
  }): Promise<Record<string, string>> {
    const catalogsByLocale =
      await this.catalogsMemoizer.memoizePromiseAndExecute(
        this.getCacheKey(applicationRegistrationId),
        () => this.loadCatalogsByLocale(applicationRegistrationId),
      );

    return catalogsByLocale?.[locale] ?? EMPTY_CATALOG;
  }

  // Clears the cached catalogs for an application registration.
  async invalidate(applicationRegistrationId: string): Promise<void> {
    await this.catalogsMemoizer.clearKeys(
      this.getCacheKey(applicationRegistrationId),
    );
  }

  // Builds the memoizer cache key for an application registration.
  private getCacheKey(applicationRegistrationId: string): CacheKey {
    return `applicationTranslation-${applicationRegistrationId}`;
  }

  // Loads and indexes an application's translation rows by locale.
  private async loadCatalogsByLocale(
    applicationRegistrationId: string,
  ): Promise<ApplicationCatalogsByLocale> {
    const rows = await this.applicationTranslationRepository.find({
      where: { applicationRegistrationId },
    });

    const catalogsByLocale: ApplicationCatalogsByLocale = {};

    for (const row of rows) {
      catalogsByLocale[row.locale] = row.messages;
    }

    return catalogsByLocale;
  }
}
