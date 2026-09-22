// Admin-panel field resolver adding computed fields (configuration status,
// asset URLs) on top of the base ApplicationRegistrationEntity.
import { Context, Parent, ResolveField } from '@nestjs/graphql';

import { AdminResolver } from 'src/engine/api/graphql/graphql-config/decorators/admin-resolver.decorator';
import { ApplicationRegistrationAssetUrlService } from 'src/engine/core-modules/application/application-registration/application-registration-asset-url.service';
import { ApplicationRegistrationEntity } from 'src/engine/core-modules/application/application-registration/application-registration.entity';
import { type IDataloaders } from 'src/engine/dataloaders/dataloader.interface';

@AdminResolver(() => ApplicationRegistrationEntity)
export class AdminPanelApplicationRegistrationResolver {
  constructor(
    private readonly applicationRegistrationAssetUrlService: ApplicationRegistrationAssetUrlService,
  ) {}

  // Resolves whether the application registration has all required variables configured, via a dataloader.
  @ResolveField(() => Boolean)
  async isConfigured(
    @Parent() registration: ApplicationRegistrationEntity,
    @Context() context: { loaders: IDataloaders },
  ): Promise<boolean> {
    return context.loaders.isConfiguredLoader.load({
      applicationRegistrationId: registration.id,
    });
  }

  // Builds the public URL for the application's logo asset.
  @ResolveField(() => String, { nullable: true })
  logoUrl(
    @Parent() registration: ApplicationRegistrationEntity,
  ): string | null {
    return this.applicationRegistrationAssetUrlService.buildLogoUrl(
      registration,
    );
  }

  // Builds the public URLs for the application's gallery images.
  @ResolveField(() => [String])
  galleryImagesUrls(
    @Parent() registration: ApplicationRegistrationEntity,
  ): string[] {
    return this.applicationRegistrationAssetUrlService.buildGalleryImageUrls(
      registration,
    );
  }
}
