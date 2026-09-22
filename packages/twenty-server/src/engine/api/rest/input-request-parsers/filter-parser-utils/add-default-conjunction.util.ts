import {
  Conjunctions,
  ROOT_FILTER_CONJUNCTION_REGEX,
} from 'src/engine/api/rest/input-request-parsers/filter-parser-utils/parse-filter.util';

// Conjunction implicitly applied to a REST filter query that doesn't
// start with an explicit and(...)/or(...) wrapper.
export const DEFAULT_CONJUNCTION = Conjunctions.and;

// Wraps a REST filter query string in the default conjunction unless it
// already starts with a root-level and/or conjunction.
export const addDefaultConjunctionIfMissing = (filterQuery: string): string => {
  if (!ROOT_FILTER_CONJUNCTION_REGEX.test(filterQuery)) {
    return `${DEFAULT_CONJUNCTION}(${filterQuery})`;
  }

  return filterQuery;
};
