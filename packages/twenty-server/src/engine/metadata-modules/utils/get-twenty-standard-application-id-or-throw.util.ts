import { TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER } from 'twenty-shared/application';
import { isDefined } from 'twenty-shared/utils';

import {
  ApplicationException,
  ApplicationExceptionCode,
} from 'src/engine/core-modules/application/application.exception';
import { type FlatApplicationCacheMaps } from 'src/engine/core-modules/application/types/flat-application-cache-maps.type';

// Looks up the id of the built-in Twenty standard application from the
// cached application maps, throwing if it's somehow missing.
export const getTwentyStandardApplicationIdOrThrow = (
  flatApplicationMaps: FlatApplicationCacheMaps,
): string => {
  const twentyStandardApplicationId =
    flatApplicationMaps.idByUniversalIdentifier[
      TWENTY_STANDARD_APPLICATION_UNIVERSAL_IDENTIFIER
    ];

  if (!isDefined(twentyStandardApplicationId)) {
    throw new ApplicationException(
      'Could not find the twenty-standard application in the workspace cache',
      ApplicationExceptionCode.APPLICATION_NOT_FOUND,
    );
  }

  return twentyStandardApplicationId;
};
