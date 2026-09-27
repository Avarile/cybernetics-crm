import { BaseWorkspaceEntity } from 'src/engine/twenty-orm/base.workspace-entity';

// Standard object storing a workspace's single set of credentials for
// connecting to the external cybernetics-data-centre.
export class DatabaseConnectionWorkspaceEntity extends BaseWorkspaceEntity {
  name: string;
  baseUrl: string;
  encryptedApiToken: string;
  tokenFingerprint: string | null;
  isEnabled: boolean;
  lastVerifiedAt: string | null;
  lastVerificationStatus: string | null;
}
