// Sanitizes raw Google Places details results into flat address fields.
import { isNonEmptyArray } from 'twenty-shared/utils';

import { type GeoMapAddressComponent } from 'src/engine/core-modules/geo-map/types/geo-map-address-component.type';
import { type GeoMapAddressFields } from 'src/engine/core-modules/geo-map/types/geo-map-address-fields.type';
import { type GeoMapLocationFields } from 'src/engine/core-modules/geo-map/types/geo-map-location-fields.type';

// Checks whether an address component carries a given Google address type.
const hasType = (
  addressComponent: GeoMapAddressComponent,
  type: string,
): boolean => addressComponent.types.includes(type);

// Flattens Google's address_components array into our flat address field
// shape, preferring the more specific type when multiple components could
// populate the same field (e.g. locality over postal_town for city).
export const sanitizePlaceDetailsResults = ({
  addressComponents,
  location,
}: {
  addressComponents: GeoMapAddressComponent[];
  location?: GeoMapLocationFields;
}): GeoMapAddressFields => {
  if (!isNonEmptyArray(addressComponents)) return {};

  const address: GeoMapAddressFields = {};

  for (const addressComponent of addressComponents) {
    if (hasType(addressComponent, 'street_number')) {
      address.street =
        addressComponent.long_name + ' ' + (address.street ?? '');
      continue;
    }

    if (hasType(addressComponent, 'route')) {
      address.street = (address.street ?? '') + addressComponent.long_name;
      continue;
    }

    if (hasType(addressComponent, 'postal_code')) {
      address.postcode = addressComponent.long_name + (address.postcode ?? '');
      continue;
    }

    if (hasType(addressComponent, 'postal_code_suffix')) {
      address.postcode =
        (address.postcode ?? '') + '-' + addressComponent.long_name;
      continue;
    }

    if (hasType(addressComponent, 'locality')) {
      address.city = addressComponent.long_name;
      continue;
    }

    if (
      hasType(addressComponent, 'postal_town') ||
      hasType(addressComponent, 'administrative_area_level_3')
    ) {
      if (!address.city) {
        address.city = addressComponent.long_name;
      }
      continue;
    }

    if (hasType(addressComponent, 'administrative_area_level_1')) {
      address.state = addressComponent.long_name;
      continue;
    }

    if (hasType(addressComponent, 'administrative_area_level_2')) {
      if (!address.state) {
        address.state = addressComponent.long_name;
      }
      continue;
    }

    if (hasType(addressComponent, 'country')) {
      address.country = addressComponent.short_name;
    }
  }

  address.location = location;

  return address;
};
