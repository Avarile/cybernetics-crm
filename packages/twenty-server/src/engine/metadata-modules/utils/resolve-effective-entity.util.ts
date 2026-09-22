import { isDefined } from 'twenty-shared/utils';

type FlatEntityWithOverrides = {
  [key: string]: unknown;
  overrides: Record<string, unknown> | null;
};

// Merges a flat entity's overrides on top of its base fields, producing
// the effective entity as seen by consumers.
export const resolveEffectiveEntity = <T extends FlatEntityWithOverrides>(
  flatEntity: T,
): T => {
  if (!isDefined(flatEntity.overrides)) {
    return flatEntity;
  }

  return {
    ...flatEntity,
    ...flatEntity.overrides,
  };
};
