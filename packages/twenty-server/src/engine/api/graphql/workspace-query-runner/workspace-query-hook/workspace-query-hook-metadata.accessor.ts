// Thin wrapper around Reflector for reading the WORKSPACE_QUERY_HOOK_METADATA
// set by the @WorkspaceQueryHook decorator.
import { Injectable, type Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { type WorkspaceQueryHookOptions } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/decorators/workspace-query-hook.decorator';
import { WORKSPACE_QUERY_HOOK_METADATA } from 'src/engine/api/graphql/workspace-query-runner/workspace-query-hook/workspace-query-hook.constants';

@Injectable()
export class WorkspaceQueryHookMetadataAccessor {
  constructor(private readonly reflector: Reflector) {}

  // Checks whether a class/function is decorated with @WorkspaceQueryHook.
  isWorkspaceQueryHook(target: Type | Function): boolean {
    if (!target) {
      return false;
    }

    return !!this.reflector.get(WORKSPACE_QUERY_HOOK_METADATA, target);
  }

  // Reads the hook's key/type/scope metadata off a decorated class.
  getWorkspaceQueryHookMetadata(
    target: Type | Function,
  ): WorkspaceQueryHookOptions | undefined {
    return this.reflector.get(WORKSPACE_QUERY_HOOK_METADATA, target);
  }
}
