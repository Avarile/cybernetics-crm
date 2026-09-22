// Validates an IFRAME-type page layout widget's configuration on update,
// skipping validation if no configuration was provided.

import { isDefined } from 'twenty-shared/utils';

import { type ValidateFlatPageLayoutWidgetTypeSpecificitiesForUpdateArgs } from 'src/engine/metadata-modules/flat-page-layout-widget/services/flat-page-layout-widget-type-validator.service';
import { type FlatPageLayoutWidgetValidationError } from 'src/engine/metadata-modules/flat-page-layout-widget/types/flat-page-layout-widget-validation-error.type';
import { validateIframeConfigurationType } from 'src/engine/metadata-modules/flat-page-layout-widget/validators/utils/validate-iframe-configuration-type.util';
import { validateIframeUrl } from 'src/engine/metadata-modules/flat-page-layout-widget/validators/utils/validate-iframe-url.util';

// Validates the configuration type, then the URL field, of the updated
// iframe configuration.
export const validateIframeFlatPageLayoutWidgetForUpdate = (
  args: ValidateFlatPageLayoutWidgetTypeSpecificitiesForUpdateArgs,
): FlatPageLayoutWidgetValidationError[] => {
  const { flatEntityToValidate } = args;
  const { universalConfiguration, title: widgetTitle } = flatEntityToValidate;
  const errors: FlatPageLayoutWidgetValidationError[] = [];

  if (!isDefined(universalConfiguration)) {
    return [];
  }

  const result = validateIframeConfigurationType({
    universalConfiguration,
    widgetTitle,
  });

  if (result.status === 'fail') {
    return result.errors;
  }

  const { iframeUniversalConfiguration } = result;

  const urlErrors = validateIframeUrl({
    iframeUniversalConfiguration,
    widgetTitle,
  });

  errors.push(...urlErrors);

  return errors;
};
