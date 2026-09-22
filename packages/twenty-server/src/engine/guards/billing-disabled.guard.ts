import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
} from '@nestjs/common';

import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

// Restricts an endpoint to instances that have billing disabled (e.g.
// self-hosted deployments without a billing integration).
@Injectable()
export class BillingDisabledGuard implements CanActivate {
  constructor(private readonly twentyConfigService: TwentyConfigService) {}

  canActivate(_context: ExecutionContext): boolean {
    return !this.twentyConfigService.isBillingEnabled();
  }
}
