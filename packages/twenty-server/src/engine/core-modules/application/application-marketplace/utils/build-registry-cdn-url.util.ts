// Builds the CDN URL for a specific file within a published package
// version on the application registry.
export const buildRegistryCdnUrl = (params: {
  cdnBaseUrl: string;
  packageName: string;
  version: string;
  filePath: string;
}): string => {
  return `${params.cdnBaseUrl}/${params.packageName}@${params.version}/${params.filePath}`;
};
