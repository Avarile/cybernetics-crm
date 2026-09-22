// Service wrapping the Google Maps Places API for address autocomplete and
// place-details lookups, disabled unless maps/address-autocomplete is
// enabled and an API key is configured.
import { Injectable } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';
import { isDefined } from 'twenty-shared/utils';

import { type GeoMapAddressFields } from 'src/engine/core-modules/geo-map/types/geo-map-address-fields.type';
import { type GeoMapAutocompleteSanitizedResult } from 'src/engine/core-modules/geo-map/types/geo-map-autocomplete-sanitized-result.type';
import { sanitizeAutocompleteResults } from 'src/engine/core-modules/geo-map/utils/sanitize-autocomplete-results.util';
import { sanitizePlaceDetailsResults } from 'src/engine/core-modules/geo-map/utils/sanitize-place-details-results.util';
import { SecureHttpClientService } from 'src/engine/core-modules/secure-http-client/secure-http-client.service';
import { TwentyConfigService } from 'src/engine/core-modules/twenty-config/twenty-config.service';

@Injectable()
export class GeoMapService {
  private apiMapKey: string | undefined;
  constructor(
    private readonly twentyConfigService: TwentyConfigService,
    private readonly secureHttpClientService: SecureHttpClientService,
  ) {
    if (
      !this.twentyConfigService.get(
        'IS_MAPS_AND_ADDRESS_AUTOCOMPLETE_ENABLED',
      ) ||
      !this.twentyConfigService.get('GOOGLE_MAP_API_KEY')
    ) {
      return;
    }
    this.apiMapKey = this.twentyConfigService.get('GOOGLE_MAP_API_KEY');
  }

  // Calls the Google Places Autocomplete API for the given address text,
  // optionally scoped to a country and to cities only.
  public async getAutoCompleteAddress(
    address: string,
    token: string,
    country?: string,
    isFieldCity?: boolean,
  ): Promise<GeoMapAutocompleteSanitizedResult[] | undefined> {
    if (!isNonEmptyString(address?.trim())) {
      return [];
    }

    let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(address)}&sessiontoken=${token}&key=${this.apiMapKey}`;

    if (isNonEmptyString(country)) {
      url += `&components=country:${country}`;
    }
    if (isDefined(isFieldCity) && isFieldCity === true) {
      url += `&types=(cities)`;
    }
    const httpClient = this.secureHttpClientService.getHttpClient();

    const result = await httpClient.get(url);

    if (result.data.status === 'OK') {
      return sanitizeAutocompleteResults(result.data.predictions);
    }

    return [];
  }

  // Calls the Google Places Details API for a place id and sanitizes the
  // response into structured address fields plus coordinates.
  public async getAddressDetails(
    placeId: string,
    token: string,
  ): Promise<GeoMapAddressFields | undefined> {
    const httpClient = this.secureHttpClientService.getHttpClient();

    const result = await httpClient.get(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&sessiontoken=${token}&fields=address_components%2Cgeometry&key=${this.apiMapKey}`,
    );

    if (result.data.status === 'OK') {
      return sanitizePlaceDetailsResults({
        addressComponents: result.data.result?.address_components,
        location: result.data.result?.geometry?.location,
      });
    }

    return {};
  }
}
