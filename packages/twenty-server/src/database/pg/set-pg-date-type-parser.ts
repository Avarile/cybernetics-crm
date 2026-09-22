import { types } from 'pg';

import { PG_DATE_TYPE_OID } from 'src/database/pg/constants/PG_DATE_TYPE_OID';

// Disables pg's default date-type parsing so DATE columns are returned as raw
// strings instead of being coerced into JS Date objects (which would apply an
// unwanted timezone shift for a value that has no time component).
export const setPgDateTypeParser = () => {
  types.setTypeParser(PG_DATE_TYPE_OID, (val: string) => val);
};
