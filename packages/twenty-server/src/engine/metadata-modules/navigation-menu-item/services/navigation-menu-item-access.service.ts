// Enforces who can create/update/delete navigation menu items: workspace-
// level items require the LAYOUTS permission, user-level items can only be
// managed by the authenticated user who owns them.

import { Injectable } from '@nestjs/common';

import { msg } from '@lingui/core/macro';
import { PermissionFlagType } from 'twenty-shared/constants';
import { isDefined } from 'twenty-shared/utils';

import {
  NavigationMenuItemException,
  NavigationMenuItemExceptionCode,
} from 'src/engine/metadata-modules/navigation-menu-item/navigation-menu-item.exception';
import {
  PermissionsException,
  PermissionsExceptionCode,
  PermissionsExceptionMessage,
} from 'src/engine/metadata-modules/permissions/permissions.exception';
import { PermissionsService } from 'src/engine/metadata-modules/permissions/permissions.service';

@Injectable()
export class NavigationMenuItemAccessService {
  constructor(private readonly permissionsService: PermissionsService) {}

  // For workspace-level items (no inputUserWorkspaceId), requires the
  // LAYOUTS permission; for user-level items, requires an authenticated user.
  async canUserCreateNavigationMenuItem({
    userWorkspaceId,
    workspaceId,
    apiKeyId,
    applicationId,
    inputUserWorkspaceId,
  }: {
    userWorkspaceId: string | undefined;
    workspaceId: string;
    apiKeyId: string | undefined;
    applicationId: string | undefined;
    inputUserWorkspaceId: string | undefined;
  }): Promise<boolean> {
    if (!isDefined(inputUserWorkspaceId)) {
      const hasPermission =
        await this.permissionsService.userHasWorkspaceSettingPermission({
          userWorkspaceId,
          workspaceId,
          setting: PermissionFlagType.LAYOUTS,
          apiKeyId,
          applicationId,
        });

      if (!hasPermission) {
        throw new PermissionsException(
          PermissionsExceptionMessage.PERMISSION_DENIED,
          PermissionsExceptionCode.PERMISSION_DENIED,
          {
            userFriendlyMessage: msg`You do not have permission to create workspace-level navigation menu items. Please contact your workspace administrator for access.`,
          },
        );
      }

      return true;
    }

    if (!isDefined(userWorkspaceId)) {
      throw new NavigationMenuItemException(
        'User-level navigation menu items can only be created by authenticated users',
        NavigationMenuItemExceptionCode.INVALID_NAVIGATION_MENU_ITEM_INPUT,
      );
    }

    return true;
  }

  // For workspace-level items, requires the LAYOUTS permission; for
  // user-level items, requires the caller to be the item's owner.
  async canUserUpdateNavigationMenuItem({
    userWorkspaceId,
    workspaceId,
    apiKeyId,
    applicationId,
    existingUserWorkspaceId,
  }: {
    userWorkspaceId: string | undefined;
    workspaceId: string;
    apiKeyId: string | undefined;
    applicationId: string | undefined;
    existingUserWorkspaceId: string | null | undefined;
  }): Promise<boolean> {
    if (!isDefined(existingUserWorkspaceId)) {
      const hasPermission =
        await this.permissionsService.userHasWorkspaceSettingPermission({
          userWorkspaceId,
          workspaceId,
          setting: PermissionFlagType.LAYOUTS,
          apiKeyId,
          applicationId,
        });

      if (!hasPermission) {
        throw new PermissionsException(
          PermissionsExceptionMessage.PERMISSION_DENIED,
          PermissionsExceptionCode.PERMISSION_DENIED,
          {
            userFriendlyMessage: msg`You do not have permission to update workspace-level navigation menu items. Please contact your workspace administrator for access.`,
          },
        );
      }

      return true;
    }

    if (!isDefined(userWorkspaceId)) {
      throw new NavigationMenuItemException(
        'User-level navigation menu items can only be updated by authenticated users',
        NavigationMenuItemExceptionCode.INVALID_NAVIGATION_MENU_ITEM_INPUT,
      );
    }

    if (existingUserWorkspaceId !== userWorkspaceId) {
      throw new NavigationMenuItemException(
        'You can only update your own navigation menu items',
        NavigationMenuItemExceptionCode.INVALID_NAVIGATION_MENU_ITEM_INPUT,
      );
    }

    return true;
  }

  // For workspace-level items, requires the LAYOUTS permission; for
  // user-level items, requires the caller to be the item's owner.
  async canUserDeleteNavigationMenuItem({
    userWorkspaceId,
    workspaceId,
    apiKeyId,
    applicationId,
    existingUserWorkspaceId,
  }: {
    userWorkspaceId: string | undefined;
    workspaceId: string;
    apiKeyId: string | undefined;
    applicationId: string | undefined;
    existingUserWorkspaceId: string | null | undefined;
  }): Promise<boolean> {
    if (!isDefined(existingUserWorkspaceId)) {
      const hasPermission =
        await this.permissionsService.userHasWorkspaceSettingPermission({
          userWorkspaceId,
          workspaceId,
          setting: PermissionFlagType.LAYOUTS,
          apiKeyId,
          applicationId,
        });

      if (!hasPermission) {
        throw new PermissionsException(
          PermissionsExceptionMessage.PERMISSION_DENIED,
          PermissionsExceptionCode.PERMISSION_DENIED,
          {
            userFriendlyMessage: msg`You do not have permission to delete workspace-level navigation menu items. Please contact your workspace administrator for access.`,
          },
        );
      }

      return true;
    }

    if (!isDefined(userWorkspaceId)) {
      throw new NavigationMenuItemException(
        'User-level navigation menu items can only be deleted by authenticated users',
        NavigationMenuItemExceptionCode.INVALID_NAVIGATION_MENU_ITEM_INPUT,
      );
    }

    if (existingUserWorkspaceId !== userWorkspaceId) {
      throw new NavigationMenuItemException(
        'You can only delete your own navigation menu items',
        NavigationMenuItemExceptionCode.INVALID_NAVIGATION_MENU_ITEM_INPUT,
      );
    }

    return true;
  }
}
