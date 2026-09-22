// Sanitizes raw Google Places autocomplete predictions for the client.
import { isNonEmptyArray } from 'twenty-shared/utils';

import { type GeoMapAutocompleteSanitizedResult } from 'src/engine/core-modules/geo-map/types/geo-map-autocomplete-sanitized-result.type';
import { type GeoMapGooglePrediction } from 'src/engine/core-modules/geo-map/types/geo-map-google-prediction.type';

// Maps raw Google Places predictions to the simplified DTO shape the
// frontend expects.
export const sanitizeAutocompleteResults = (
  autocompleteResults: GeoMapGooglePrediction[],
): GeoMapAutocompleteSanitizedResult[] => {
  if (!isNonEmptyArray(autocompleteResults)) return [];

  return autocompleteResults.map((result) => ({
    text: result.description,
    placeId: result.place_id,
  }));
};
