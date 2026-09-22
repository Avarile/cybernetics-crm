// In-memory registry of pre/post query hook instances, keyed by
// "<object>.<method>". Lookups also merge in any "*.<method>" wildcard
// hooks registered for that method, applied ahead of the object-specific ones.
import { Injectable } from '@nestjs/common';
import { type Module } from '@nestjs/core/injector/module';

import { isDefined } from 'twenty-shared/utils';

import {
  type WorkspacePostQueryHookInstance,
  type WorkspacePreQueryHookInstance,
} from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/interfaces/workspace-query-hook.interface';
import { type WorkspaceResolverBuilderMethodNames } from 'src/engine/api/graphql/workspace-resolver-builder/interfaces/workspace-resolvers-builder.interface';

import { type WorkspaceQueryHookKey } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';

interface WorkspaceQueryHookData<T> {
  instance: T;
  host: Module;
  isRequestScoped: boolean;
}

@Injectable()
export class WorkspaceQueryHookStorage {
  private preHookInstances = new Map<
    WorkspaceQueryHookKey,
    WorkspaceQueryHookData<WorkspacePreQueryHookInstance>[]
  >();
  private postHookInstances = new Map<
    WorkspaceQueryHookKey,
    WorkspaceQueryHookData<WorkspacePostQueryHookInstance>[]
  >();

  // Registers a pre-hook instance under its "<object>.<method>" (or wildcard) key.
  registerWorkspaceQueryPreHookInstance(
    key: WorkspaceQueryHookKey,
    data: WorkspaceQueryHookData<WorkspacePreQueryHookInstance>,
  ) {
    if (!this.preHookInstances.has(key)) {
      this.preHookInstances.set(key, []);
    }

    this.preHookInstances.get(key)?.push(data);
  }

  // Returns the pre-hooks for a key: any "*.<method>" wildcard hooks
  // first, followed by hooks registered specifically for that object.
  getWorkspaceQueryPreHookInstances(
    key: WorkspaceQueryHookKey,
  ): WorkspaceQueryHookData<WorkspacePreQueryHookInstance>[] {
    const methodName = key.split('.')?.[1] as
      | WorkspaceResolverBuilderMethodNames
      | undefined;
    let wildcardInstances: WorkspaceQueryHookData<WorkspacePreQueryHookInstance>[] =
      [];

    if (!methodName) {
      throw new Error(`Can't split workspace query hook key: ${key}`);
    }

    // Retrieve wildcard pre-hook instances
    const wildcardPrehooksInstance = this.preHookInstances.get(
      `*.${methodName}`,
    );

    if (isDefined(wildcardPrehooksInstance)) {
      wildcardInstances = wildcardPrehooksInstance;
    }

    return [...wildcardInstances, ...(this.preHookInstances.get(key) ?? [])];
  }

  // Registers a post-hook instance under its "<object>.<method>" (or wildcard) key.
  registerWorkspacePostQueryHookInstance(
    key: WorkspaceQueryHookKey,
    data: WorkspaceQueryHookData<WorkspacePostQueryHookInstance>,
  ) {
    if (!this.postHookInstances.has(key)) {
      this.postHookInstances.set(key, []);
    }

    this.postHookInstances.get(key)?.push(data);
  }

  // Returns the post-hooks for a key: any "*.<method>" wildcard hooks
  // first, followed by hooks registered specifically for that object.
  getWorkspacePostQueryHookInstances(
    key: WorkspaceQueryHookKey,
  ): WorkspaceQueryHookData<WorkspacePostQueryHookInstance>[] {
    const methodName = key.split('.')?.[1] as
      | WorkspaceResolverBuilderMethodNames
      | undefined;
    let wildcardInstances: WorkspaceQueryHookData<WorkspacePostQueryHookInstance>[] =
      [];

    if (!methodName) {
      throw new Error(`Can't split workspace query hook key: ${key}`);
    }

    // Retrieve wildcard post-hook instances
    const wildcardPosthooksInstance = this.postHookInstances.get(
      `*.${methodName}`,
    );

    if (isDefined(wildcardPosthooksInstance)) {
      wildcardInstances = wildcardPosthooksInstance;
    }

    const specificInstances = this.postHookInstances.get(key) ?? [];

    return [...wildcardInstances, ...specificInstances];
  }
}
