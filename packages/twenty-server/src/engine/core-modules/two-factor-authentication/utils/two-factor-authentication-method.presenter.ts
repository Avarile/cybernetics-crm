import { isDefined } from 'twenty-shared/utils';

import { type TwoFactorAuthenticationMethodSummaryDTO } from 'src/engine/core-modules/two-factor-authentication/dto/two-factor-authentication-method.dto';
import { type TwoFactorAuthenticationMethodEntity } from 'src/engine/core-modules/two-factor-authentication/entities/two-factor-authentication-method.entity';

// Maps 2FA method entities to their GraphQL-exposed summary DTO (no secrets included)
export function buildTwoFactorAuthenticationMethodSummary(
  methods: TwoFactorAuthenticationMethodEntity[] | undefined,
): TwoFactorAuthenticationMethodSummaryDTO[] | undefined {
  if (!isDefined(methods)) return undefined;

  return methods.map((method) => ({
    twoFactorAuthenticationMethodId: method.id,
    status: method.status,
    strategy: method.strategy,
  }));
}
