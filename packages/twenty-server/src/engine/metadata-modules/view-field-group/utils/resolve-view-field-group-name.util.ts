import { type I18n } from '@lingui/core';

import { isDefined } from 'twenty-shared/utils';

import { translateStandardLabel } from 'src/engine/core-modules/i18n/utils/translate-standard-label.util';
import { type ViewFieldGroupOverrides } from 'src/engine/metadata-modules/view-field-group/entities/view-field-group.entity';

// Resolves a view field group's effective display name: an explicit name
// override wins outright, otherwise the base name is translated as a
// standard label via the owning application's i18n catalog.
export const resolveViewFieldGroupName = ({
  name,
  applicationId,
  twentyStandardApplicationId,
  overrides,
  i18nInstance,
  applicationCatalog,
}: {
  name: string;
  applicationId: string;
  twentyStandardApplicationId: string;
  overrides?: ViewFieldGroupOverrides | null;
  i18nInstance: I18n;
  applicationCatalog?: Record<string, string>;
}): string => {
  const isStandardApp = applicationId === twentyStandardApplicationId;

  if (isDefined(overrides?.name)) {
    return name;
  }

  return translateStandardLabel({
    sourceValue: name,
    isStandardApp,
    applicationCatalog,
    i18nInstance,
  });
};
