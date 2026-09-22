// Validates a FRONT_COMPONENT-type page layout widget's configuration on
// update, skipping validation if no configuration was provided.

import { isDefined } from 'twenty-shared/utils';

import { type ValidateFlatPageLayoutWidgetTypeSpecificitiesForUpdateArgs } from 'src/engine/metadata-modules/flat-page-layout-widget/services/flat-page-layout-widget-type-validator.service';
import { type FlatPageLayoutWidgetValidationError } from 'src/engine/metadata-modules/flat-page-layout-widget/types/flat-page-layout-widget-validation-error.type';
import { validateFrontComponentConfigurationType } from 'src/engine/metadata-modules/flat-page-layout-widget/validators/utils/validate-front-component-configuration-type.util';

// Skips validation when configuration wasn't updated, otherwise delegates
// to the shared configuration-type check.
export const validateFrontComponentFlatPageLayoutWidgetForUpdate = (
  args: ValidateFlatPageLayoutWidgetTypeSpecificitiesForUpdateArgs,
): FlatPageLayoutWidgetValidationError[] => {
  const { flatEntityToValidate } = args;
  const { universalConfiguration, title } = flatEntityToValidate;
  const errors: FlatPageLayoutWidgetValidationError[] = [];

  if (!isDefined(universalConfiguration)) {
    return [];
  }

  const configurationTypeErrors = validateFrontComponentConfigurationType({
    universalConfiguration,
    title,
  });

  errors.push(...configurationTypeErrors);

  return errors;
};
