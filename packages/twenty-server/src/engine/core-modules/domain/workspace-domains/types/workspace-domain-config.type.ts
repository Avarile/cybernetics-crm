import { type WorkspaceEntity } from 'src/engine/core-modules/workspace/workspace.entity';

// Minimal workspace fields needed to resolve or build its domain URLs
export type WorkspaceDomainConfig = Pick<
  WorkspaceEntity,
  'subdomain' | 'customDomain' | 'isCustomDomainEnabled'
>;
