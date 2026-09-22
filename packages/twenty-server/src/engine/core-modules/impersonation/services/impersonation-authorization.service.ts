// Service deciding whether an impersonation attempt is authorized: whether
// it's server-level (across workspaces, requiring server impersonation
// rights and, outside dev, 2FA) or workspace-level (requiring the
// IMPERSONATE permission and, for admin targets, admin privileges).
import { Injectable } from '@nestjs/common';

import { PermissionFlagType } from 'twenty-shared/constants';
import { isDefined } from 'twenty-shared/utils';

import { userHasAdminPrivileges } from 'src/engine/core-modules/impersonation/utils/user-has-admin-privileges.util';
import { NodeEnvironment } from 'src/engine/core-modules/twenty-config/interfaces/node-environment.interface';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { twoFactorAuthenticationMethodsValidator } from 'src/engine/core-modules/two-factor-authentication/two-factor-authentication.validation';
import { UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';
import { PermissionsService } from 'src/engine/metadata-modules/permissions/permissions.service';

export type ImpersonationLevel = 'server' | 'workspace';

export type ImpersonationDenialReason =
  | 'SERVER_LEVEL_NOT_ALLOWED'
  | 'SERVER_LEVEL_2FA_PROVISION_REQUIRED'
  | 'SERVER_LEVEL_2FA_VERIFICATION_REQUIRED'
  | 'WORKSPACE_LEVEL_NOT_ALLOWED'
  | 'TARGET_HAS_ADMIN_PRIVILEGES';

export type ImpersonationAuthorizationResult =
  | { allowed: true; level: ImpersonationLevel }
  | {
      allowed: false;
      level: ImpersonationLevel;
      reason: ImpersonationDenialReason;
    };

@Injectable()
export class ImpersonationAuthorizationService {
  constructor(
    private readonly permissionsService: PermissionsService,
    private readonly twentyConfigService: TwentyConfigService,
  ) {}

  // Impersonation is "server" level when crossing workspace boundaries,
  // otherwise "workspace" level (same-workspace impersonation).
  getImpersonationLevel(
    impersonatorUserWorkspace: UserWorkspaceEntity,
    targetUserWorkspace: UserWorkspaceEntity,
  ): ImpersonationLevel {
    return targetUserWorkspace.workspace.id !==
      impersonatorUserWorkspace.workspace.id
      ? 'server'
      : 'workspace';
  }

  // Determines the impersonation level, then applies the matching rules:
  // for server-level, checks the impersonator's server-wide right and the
  // target workspace's opt-in, plus 2FA when required outside development;
  // for workspace-level, checks the IMPERSONATE permission and blocks
  // non-admins from impersonating admin targets.
  async checkImpersonationAuthorization(
    impersonatorUserWorkspace: UserWorkspaceEntity,
    targetUserWorkspace: UserWorkspaceEntity,
  ): Promise<ImpersonationAuthorizationResult> {
    const level = this.getImpersonationLevel(
      impersonatorUserWorkspace,
      targetUserWorkspace,
    );

    if (level === 'server') {
      const hasServerLevelImpersonatePermission =
        impersonatorUserWorkspace.user.canImpersonate === true &&
        targetUserWorkspace.workspace.allowImpersonation === true;

      if (!hasServerLevelImpersonatePermission) {
        return { allowed: false, level, reason: 'SERVER_LEVEL_NOT_ALLOWED' };
      }

      if (this.isTwoFactorRequiredForServerLevelImpersonation()) {
        const twoFactorDenialReason = this.getServerLevelTwoFactorDenialReason(
          impersonatorUserWorkspace,
        );

        if (isDefined(twoFactorDenialReason)) {
          return { allowed: false, level, reason: twoFactorDenialReason };
        }
      }

      return { allowed: true, level };
    }

    const hasWorkspaceLevelImpersonatePermission =
      await this.permissionsService.userHasWorkspaceSettingPermission({
        userWorkspaceId: impersonatorUserWorkspace.id,
        setting: PermissionFlagType.IMPERSONATE,
        workspaceId: targetUserWorkspace.workspace.id,
      });

    if (!hasWorkspaceLevelImpersonatePermission) {
      return { allowed: false, level, reason: 'WORKSPACE_LEVEL_NOT_ALLOWED' };
    }

    if (
      userHasAdminPrivileges(targetUserWorkspace.user) &&
      !userHasAdminPrivileges(impersonatorUserWorkspace.user)
    ) {
      return { allowed: false, level, reason: 'TARGET_HAS_ADMIN_PRIVILEGES' };
    }

    return { allowed: true, level };
  }

  // 2FA is required for server-level impersonation everywhere except development.
  private isTwoFactorRequiredForServerLevelImpersonation(): boolean {
    return (
      this.twentyConfigService.get('NODE_ENV') !== NodeEnvironment.DEVELOPMENT
    );
  }

  // Returns why 2FA blocks the impersonator (not provisioned vs not
  // verified), or undefined if their 2FA is satisfied.
  private getServerLevelTwoFactorDenialReason(
    impersonatorUserWorkspace: UserWorkspaceEntity,
  ): ImpersonationDenialReason | undefined {
    const twoFactorAuthenticationMethods =
      impersonatorUserWorkspace.twoFactorAuthenticationMethods;

    if (
      !twoFactorAuthenticationMethodsValidator.areDefined(
        twoFactorAuthenticationMethods,
      )
    ) {
      return 'SERVER_LEVEL_2FA_PROVISION_REQUIRED';
    }

    if (
      !twoFactorAuthenticationMethodsValidator.areVerified(
        twoFactorAuthenticationMethods,
      )
    ) {
      return 'SERVER_LEVEL_2FA_VERIFICATION_REQUIRED';
    }

    return undefined;
  }
}
