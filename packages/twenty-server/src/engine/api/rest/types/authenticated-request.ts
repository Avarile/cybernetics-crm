import { type Request } from 'express';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';

// An Express request enriched with the resolved workspace auth context,
// as attached by the REST API's auth guards/middleware.
export type AuthenticatedRequest = Request & WorkspaceAuthContext;
