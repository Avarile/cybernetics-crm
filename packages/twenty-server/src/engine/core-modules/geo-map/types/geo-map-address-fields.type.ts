import { type GeoMapLocationFields } from 'src/engine/core-modules/geo-map/types/geo-map-location-fields.type';

// Structured address fields returned to the client after sanitizing a place
// details lookup.
export type GeoMapAddressFields = {
  street?: string;
  state?: string;
  postcode?: string;
  city?: string;
  country?: string;
  location?: GeoMapLocationFields;
};
