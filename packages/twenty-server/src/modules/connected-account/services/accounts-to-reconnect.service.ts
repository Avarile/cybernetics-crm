import { Injectable } from '@nestjs/common';

import { UserVarsService } from 'src/engine/core-modules/user/user-vars/services/user-vars.service';
import {
  type AccountsToReconnectKeyValueType,
  AccountsToReconnectKeys,
} from 'src/modules/connected-account/types/accounts-to-reconnect-key-value.type';

// Tracks, per user, which connected accounts need re-authentication —
// surfaced in the UI as a reconnect prompt. Backed by per-user settings storage.
@Injectable()
export class AccountsToReconnectService {
  constructor(
    private readonly userVarsService: UserVarsService<AccountsToReconnectKeyValueType>,
  ) {}

  // Removes an account from every reconnect-reason list for a user.
  public async removeAccountToReconnect(
    userId: string,
    workspaceId: string,
    connectedAccountId: string,
  ) {
    for (const key of Object.values(AccountsToReconnectKeys)) {
      await this.removeAccountToReconnectByKey(
        key,
        userId,
        workspaceId,
        connectedAccountId,
      );
    }
  }

  // Removes an account from one reconnect-reason list, deleting the setting
  // entirely if the list becomes empty.
  private async removeAccountToReconnectByKey(
    key: AccountsToReconnectKeys,
    userId: string,
    workspaceId: string,
    connectedAccountId: string,
  ) {
    const accountsToReconnect = await this.userVarsService.get({
      userId,
      workspaceId,
      key,
    });

    if (!accountsToReconnect) {
      return;
    }

    const updatedAccountsToReconnect = accountsToReconnect.filter(
      (id) => id !== connectedAccountId,
    );

    if (updatedAccountsToReconnect.length === 0) {
      await this.userVarsService.delete({
        userId,
        workspaceId,
        key,
      });

      return;
    }

    await this.userVarsService.set({
      userId,
      workspaceId,
      key,
      value: updatedAccountsToReconnect,
    });
  }

  // Adds an account to a reconnect-reason list, if not already present.
  public async addAccountToReconnectByKey(
    key: AccountsToReconnectKeys,
    userId: string,
    workspaceId: string,
    connectedAccountId: string,
  ) {
    const accountsToReconnect =
      (await this.userVarsService.get({
        userId,
        workspaceId,
        key,
      })) ?? [];

    if (accountsToReconnect.includes(connectedAccountId)) {
      return;
    }

    accountsToReconnect.push(connectedAccountId);

    await this.userVarsService.set({
      userId,
      workspaceId,
      key,
      value: accountsToReconnect,
    });
  }
}
