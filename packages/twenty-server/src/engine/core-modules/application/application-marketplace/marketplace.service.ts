// Talks to the external npm-compatible app registry and its CDN: searches
// for published apps tagged as Twenty apps, and fetches a package's
// manifest or individual asset files.
import { Injectable, Logger } from '@nestjs/common';

import axios from 'axios';
import { type Manifest } from 'twenty-shared/application';
import { z } from 'zod';

import { buildRegistryCdnUrl } from 'src/engine/core-modules/application/application-marketplace/utils/build-registry-cdn-url.util';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

const MAX_REGISTRY_ASSET_SIZE_BYTES = 10 * 1024 * 1024; // 10Mb

export type RegistryPackageInfo = {
  name: string;
  version: string;
  description: string;
  author: string;
  websiteUrl?: string;
};

const registrySearchResultSchema = z.object({
  objects: z.array(
    z.object({
      package: z.object({
        name: z.string(),
        version: z.string(),
        description: z.string().optional(),
        keywords: z.array(z.string()).optional(),
        author: z.object({ name: z.string().optional() }).optional(),
        links: z
          .object({
            homepage: z.string().optional(),
            npm: z.string().optional(),
          })
          .optional(),
      }),
    }),
  ),
});

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(private readonly twentyConfigService: TwentyConfigService) {}

  // Fetches and parses manifest.json for a package version from the
  // registry CDN, returning null if it's missing or malformed.
  async fetchManifestFromRegistryCdn(
    packageName: string,
    version: string,
  ): Promise<Manifest | null> {
    const cdnBaseUrl = this.twentyConfigService.get('APP_REGISTRY_CDN_URL');
    const url = buildRegistryCdnUrl({
      cdnBaseUrl,
      packageName,
      version,
      filePath: 'manifest.json',
    });

    try {
      const { data } = await axios.get(url, {
        headers: { 'User-Agent': 'Twenty-Marketplace' },
        timeout: 5_000,
      });

      if (!data?.application) {
        return null;
      }

      return data as Manifest;
    } catch {
      this.logger.debug(
        `Could not fetch manifest from CDN for ${packageName}@${version}`,
      );

      return null;
    }
  }

  // Fetches an arbitrary asset file for a package version from the
  // registry CDN, enforcing a max size, returning null on failure.
  async fetchAssetFromRegistryCdn(
    packageName: string,
    version: string,
    filePath: string,
  ): Promise<Buffer | null> {
    const cdnBaseUrl = this.twentyConfigService.get('APP_REGISTRY_CDN_URL');
    const url = buildRegistryCdnUrl({
      cdnBaseUrl,
      packageName,
      version,
      filePath,
    });

    try {
      const { data } = await axios.get<ArrayBuffer>(url, {
        headers: { 'User-Agent': 'Twenty-Marketplace' },
        timeout: 10_000,
        responseType: 'arraybuffer',
        maxContentLength: MAX_REGISTRY_ASSET_SIZE_BYTES,
      });

      return Buffer.from(data);
    } catch {
      this.logger.debug(
        `Could not fetch asset "${filePath}" from CDN for ${packageName}@${version}`,
      );

      return null;
    }
  }

  // Searches the registry for packages tagged as Twenty apps and returns
  // their basic package info, validating the response shape.
  async fetchAppsFromRegistry(): Promise<RegistryPackageInfo[]> {
    const registryUrl = this.twentyConfigService.get('APP_REGISTRY_URL');

    try {
      const { data } = await axios.get(
        `${registryUrl}/-/v1/search?text=keywords:twenty-app&size=250`,
        {
          headers: { 'User-Agent': 'Twenty-Marketplace' },
          timeout: 10_000,
        },
      );

      const parsed = registrySearchResultSchema.safeParse(data);

      if (!parsed.success) {
        this.logger.warn(
          `Unexpected registry search response shape: ${parsed.error.message}`,
        );

        return [];
      }

      return parsed.data.objects.map((result) => {
        const { name, version, description, author, links } = result.package;

        return {
          name,
          version,
          description: description ?? '',
          author: author?.name ?? 'Unknown',
          websiteUrl: links?.homepage ?? links?.npm,
        };
      });
    } catch (error) {
      this.logger.warn(
        `Failed to fetch apps from registry ${registryUrl}: ${error instanceof Error ? error.message : String(error)}`,
      );

      return [];
    }
  }
}
