import { type ApplicationManifest } from 'twenty-shared/application';

// Returns a manifest application's gallery image paths, falling back to
// the deprecated screenshots field when galleryImages isn't set.
export const toGalleryImagePaths = (
  application: ApplicationManifest | undefined,
): string[] => {
  const galleryImages = application?.galleryImages;

  if (galleryImages && galleryImages.length > 0) {
    return galleryImages;
  }

  return application?.screenshots ?? [];
};
