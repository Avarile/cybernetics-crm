// Serves marketplace catalog data for GraphQL resolvers: listing apps from
// the cached catalog and building the full detail DTO (including asset
// URLs and role/permission breakdown) for a single app.
import { Injectable } from '@nestjs/common';

import { type RoleManifest } from 'twenty-shared/application';
import { isDefined, isNonEmptyArray } from 'twenty-shared/utils';

import { CoreEntityCacheService } from 'src/engine/core-entity-cache/services/core-entity-cache.service';
import { MARKETPLACE_CATALOG_CACHE_ENTITY_ID } from 'src/engine/core-modules/application/application-marketplace/constants/marketplace-apps-cache.constant';
import { MarketplaceAppDTO } from 'src/engine/core-modules/application/application-marketplace/dtos/marketplace-app.dto';
import { MarketplaceAppDetailDTO } from 'src/engine/core-modules/application/application-marketplace/dtos/marketplace-app-detail.dto';
import { MarketplaceAppRoleDTO } from 'src/engine/core-modules/application/application-marketplace/dtos/marketplace-app-role.dto';
import { ApplicationRegistrationAssetUrlService } from 'src/engine/core-modules/application/application-registration/application-registration-asset-url.service';
import { type ApplicationRegistrationEntity } from 'src/engine/core-modules/application/application-registration/application-registration.entity';
import {
  ApplicationRegistrationException,
  ApplicationRegistrationExceptionCode,
} from 'src/engine/core-modules/application/application-registration/application-registration.exception';
import { ApplicationRegistrationService } from 'src/engine/core-modules/application/application-registration/application-registration.service';

@Injectable()
export class MarketplaceQueryService {
  constructor(
    private readonly applicationRegistrationService: ApplicationRegistrationService,
    private readonly applicationRegistrationAssetUrlService: ApplicationRegistrationAssetUrlService,
    private readonly coreEntityCacheService: CoreEntityCacheService,
  ) {}

  // Reads the cached marketplace catalog and optionally filters to
  // specific universal identifiers and/or vetted status.
  async findManyMarketplaceApps({
    universalIdentifiers,
    isVetted,
  }: {
    universalIdentifiers?: string[];
    isVetted?: boolean;
  } = {}): Promise<MarketplaceAppDTO[]> {
    const appsByUniversalIdentifier =
      (await this.coreEntityCacheService.get(
        'marketplaceCatalog',
        MARKETPLACE_CATALOG_CACHE_ENTITY_ID,
      )) ?? {};

    const apps = isNonEmptyArray(universalIdentifiers)
      ? universalIdentifiers
          .map(
            (universalIdentifier) =>
              appsByUniversalIdentifier[universalIdentifier],
          )
          .filter(isDefined)
      : Object.values(appsByUniversalIdentifier);

    if (!isDefined(isVetted)) {
      return apps;
    }

    return apps.filter((app) => app.isVetted === isVetted);
  }

  // Looks up a registration by universal identifier and returns its full
  // marketplace detail DTO.
  async findMarketplaceAppDetail(
    universalIdentifier: string,
  ): Promise<MarketplaceAppDetailDTO> {
    const registration =
      await this.findRegistrationByUniversalIdentifier(universalIdentifier);

    return this.toMarketplaceAppDetailDTO(registration);
  }

  // Looks up an application registration by universal identifier, throwing
  // if none exists.
  async findRegistrationByUniversalIdentifier(
    universalIdentifier: string,
  ): Promise<ApplicationRegistrationEntity> {
    const registration =
      await this.applicationRegistrationService.findOneByUniversalIdentifier(
        universalIdentifier,
      );

    if (!isDefined(registration)) {
      throw new ApplicationRegistrationException(
        `No application registration found for identifier "${universalIdentifier}"`,
        ApplicationRegistrationExceptionCode.APPLICATION_REGISTRATION_NOT_FOUND,
      );
    }

    return registration;
  }

  // Maps a registration entity (falling back to manifest fields for
  // metadata not yet promoted to registration columns) into the full
  // marketplace app detail DTO, resolving logo/gallery asset URLs.
  private toMarketplaceAppDetailDTO(
    registration: ApplicationRegistrationEntity,
  ): MarketplaceAppDetailDTO {
    const galleryImageUrls =
      this.applicationRegistrationAssetUrlService.buildGalleryImageUrls(
        registration,
      );

    return {
      id: registration.id,
      universalIdentifier: registration.universalIdentifier,
      name: registration.name,
      sourceType: registration.sourceType,
      sourcePackage: registration.sourcePackage ?? undefined,
      latestAvailableVersion: registration.latestAvailableVersion ?? undefined,
      isListed: registration.isListed,
      isVetted: registration.isVetted,
      description:
        registration.description ??
        registration.manifest?.application?.description ??
        undefined,
      author:
        registration.author ??
        registration.manifest?.application?.author ??
        undefined,
      category:
        registration.category ??
        registration.manifest?.application?.category ??
        undefined,
      logo:
        this.applicationRegistrationAssetUrlService.buildLogoUrl(
          registration,
        ) ?? undefined,
      websiteUrl:
        registration.websiteUrl ??
        registration.manifest?.application?.websiteUrl ??
        undefined,
      aboutDescription:
        registration.aboutDescription ??
        registration.manifest?.application?.aboutDescription ??
        undefined,
      termsUrl:
        registration.termsUrl ??
        registration.manifest?.application?.termsUrl ??
        undefined,
      emailSupport:
        registration.emailSupport ??
        registration.manifest?.application?.emailSupport ??
        undefined,
      issueReportUrl:
        registration.issueReportUrl ??
        registration.manifest?.application?.issueReportUrl ??
        undefined,
      screenshots: galleryImageUrls,
      galleryImages: galleryImageUrls,
      defaultRoleUniversalIdentifier:
        registration.manifest?.application?.defaultRoleUniversalIdentifier,
      roles: registration.manifest?.roles?.map((role) =>
        this.toMarketplaceAppRoleDTO(role),
      ),
      manifest: registration.manifest ?? undefined,
    };
  }

  // Maps a manifest role (with its permission entries) to the marketplace
  // app role DTO shown to admins before installing.
  private toMarketplaceAppRoleDTO(role: RoleManifest): MarketplaceAppRoleDTO {
    return {
      universalIdentifier: role.universalIdentifier,
      label: role.label,
      description: role.description,
      icon: role.icon,
      canUpdateAllSettings: role.canUpdateAllSettings,
      canAccessAllTools: role.canAccessAllTools,
      canReadAllObjectRecords: role.canReadAllObjectRecords,
      canUpdateAllObjectRecords: role.canUpdateAllObjectRecords,
      canSoftDeleteAllObjectRecords: role.canSoftDeleteAllObjectRecords,
      canDestroyAllObjectRecords: role.canDestroyAllObjectRecords,
      permissionFlagUniversalIdentifiers:
        role.permissionFlagUniversalIdentifiers,
      objectPermissions: role.objectPermissions?.map((permission) => ({
        universalIdentifier: permission.universalIdentifier,
        objectUniversalIdentifier: permission.objectUniversalIdentifier,
        canReadObjectRecords: permission.canReadObjectRecords,
        canUpdateObjectRecords: permission.canUpdateObjectRecords,
        canSoftDeleteObjectRecords: permission.canSoftDeleteObjectRecords,
        canDestroyObjectRecords: permission.canDestroyObjectRecords,
      })),
      fieldPermissions: role.fieldPermissions?.map((permission) => ({
        universalIdentifier: permission.universalIdentifier,
        objectUniversalIdentifier: permission.objectUniversalIdentifier,
        fieldUniversalIdentifier: permission.fieldUniversalIdentifier,
        canReadFieldValue: permission.canReadFieldValue,
        canUpdateFieldValue: permission.canUpdateFieldValue,
      })),
    };
  }
}
