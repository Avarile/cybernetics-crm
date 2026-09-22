import {
  type FirstDayOfTheWeek,
  type ObjectRecordGroupByDateGranularity,
} from 'twenty-shared/types';

// Shape of a groupBy entry for a DATE/DATE_TIME field: bucketing
// granularity plus optional week-start-day and time zone for the bucketing.
export type DateFieldGroupByDefinition = {
  granularity: ObjectRecordGroupByDateGranularity;
  weekStartDay?: FirstDayOfTheWeek;
  timeZone?: string;
};
