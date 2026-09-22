// Decides whether a subfield of a composite field type should be indexed
// for full-text search.
import { FieldMetadataType } from 'twenty-shared/types';

// Only TEXT subfields are searchable, and rich text/phone composites further
// restrict which of their subfields qualify.
export const isSearchableSubfield = (
  compositeFieldMetadataType: FieldMetadataType,
  subFieldMetadataType: FieldMetadataType,
  subFieldName: string,
) => {
  if (subFieldMetadataType !== FieldMetadataType.TEXT) {
    return false;
  }

  switch (compositeFieldMetadataType) {
    case FieldMetadataType.RICH_TEXT:
      return ['markdown'].includes(subFieldName);
    case FieldMetadataType.PHONES:
      return ['primaryPhoneNumber', 'primaryPhoneCallingCode'].includes(
        subFieldName,
      );
    default:
      return true;
  }
};
