// Service used by REST/HTTP auth guards to redirect a failed request to the
// workspace's error page (rather than returning a raw error), capturing
// unexpected exceptions along the way. GraphQL requests re-throw instead.
import { ExecutionContext, Injectable } from '@nestjs/common';

import { type Request } from 'express';
import { AppPath } from 'twenty-shared/types';

import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import { DomainServerConfigService } from 'src/engine/core-modules/domain/domain-server-config/services/domain-server-config.service';
import { WorkspaceDomainsService } from 'src/engine/core-modules/domain/workspace-domains/services/workspace-domains.service';
import { ExceptionHandlerService } from 'src/engine/core-modules/exception-handler/exception-handler.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';
import { type CustomException } from 'src/utils/custom-exception';

@Injectable()
export class GuardRedirectService {
  constructor(
    private readonly twentyConfigService: TwentyConfigService,
    private readonly exceptionHandlerService: ExceptionHandlerService,
    private readonly domainsServerConfigService: DomainServerConfigService,
    private readonly workspaceDomainsService: WorkspaceDomainsService,
  ) {}

  // Re-throws the error for GraphQL requests, or redirects HTTP requests to
  // the workspace's error page with the error encoded in the URL.
  dispatchErrorFromGuard(
    context: ExecutionContext,
    error: Error | CustomException,
    workspace: {
      id?: string;
      subdomain: string;
      customDomain: string | null;
      isCustomDomainEnabled?: boolean;
    },
    pathname = AppPath.Verify,
  ) {
    if ('contextType' in context && context.contextType === 'graphql') {
      throw error;
    }

    context.switchToHttp().getResponse().redirect(
      this.getRedirectErrorUrlAndCaptureExceptions({
        error,
        workspace,
        pathname,
      }),
    );
  }

  // Derives the subdomain/custom domain from the request's Referer header,
  // falling back to the default subdomain if it can't be determined.
  getSubdomainAndCustomDomainFromContext(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    const subdomainAndDomainFromReferer = request.headers.referer
      ? this.domainsServerConfigService.getSubdomainAndDomainFromUrl(
          request.headers.referer,
        )
      : null;

    return subdomainAndDomainFromReferer &&
      subdomainAndDomainFromReferer.subdomain
      ? {
          subdomain: subdomainAndDomainFromReferer.subdomain,
          customDomain: subdomainAndDomainFromReferer.domain,
        }
      : {
          subdomain: this.twentyConfigService.get('DEFAULT_SUBDOMAIN'),
          customDomain: null,
        };
  }

  // Reports the error to the exception handler, skipping expected
  // (non-internal) auth exceptions to avoid noisy monitoring alerts.
  private captureException(err: Error | CustomException, workspaceId?: string) {
    if (
      err instanceof AuthException &&
      err.code !== AuthExceptionCode.INTERNAL_SERVER_ERROR
    )
      return;

    this.exceptionHandlerService.captureExceptions([err], {
      workspace: {
        id: workspaceId,
      },
    });
  }

  // Captures the exception (if unexpected) and builds the workspace-scoped
  // redirect URL encoding the error message.
  getRedirectErrorUrlAndCaptureExceptions({
    error,
    workspace,
    pathname,
  }: {
    error: Error | AuthException;
    workspace: {
      id?: string;
      subdomain: string;
      customDomain: string | null;
      isCustomDomainEnabled?: boolean;
    };
    pathname: string;
  }) {
    this.captureException(error, workspace.id);

    const errorMessage =
      error instanceof AuthException
        ? error.message
        : `Authentication error: ${error instanceof Error ? error.message : String(error)}`;

    return this.workspaceDomainsService.computeWorkspaceRedirectErrorUrl(
      errorMessage,
      {
        subdomain: workspace.subdomain,
        customDomain: workspace.customDomain,
        isCustomDomainEnabled: workspace.isCustomDomainEnabled ?? false,
      },
      pathname,
    );
  }
}
