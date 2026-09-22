import { type MarketplaceAppDTO } from 'src/engine/core-modules/application/application-marketplace/dtos/marketplace-app.dto';
import { type FlatUserWorkspace } from 'src/engine/core-modules/user-workspace/types/flat-user-workspace.type';
import { type FlatUser } from 'src/engine/core-modules/user/types/flat-user.type';
import { type FlatWorkspace } from 'src/engine/core-modules/workspace/types/flat-workspace.type';

// Maps each core-entity cache key name to the data type it caches.
export type CoreEntityCacheDataMap = {
  workspaceEntity: FlatWorkspace;
  user: FlatUser;
  userWorkspaceEntity: FlatUserWorkspace;
  signingKeyPublicKey: string;
  marketplaceCatalog: Record<string, MarketplaceAppDTO>;
};

export type CoreEntityCacheKeyName = keyof CoreEntityCacheDataMap;

// Redis key-namespace prefix used for each cache key name.
export const CORE_ENTITY_CACHE_KEYS: Record<CoreEntityCacheKeyName, string> = {
  workspaceEntity: 'workspace',
  user: 'user',
  userWorkspaceEntity: 'user-workspace',
  signingKeyPublicKey: 'signing-key-public-key',
  marketplaceCatalog: 'marketplace-catalog',
};
