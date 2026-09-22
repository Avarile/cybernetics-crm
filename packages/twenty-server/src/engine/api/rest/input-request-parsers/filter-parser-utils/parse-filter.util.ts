import { BadRequestException } from '@nestjs/common';

import { msg } from '@lingui/core/macro';

import { type FieldValue } from 'src/engine/api/rest/core/types/field-value.type';
import { formatFieldValue } from 'src/engine/api/rest/input-request-parsers/filter-parser-utils/format-field-values.util';
import { parseBaseFilter } from 'src/engine/api/rest/input-request-parsers/filter-parser-utils/parse-base-filter.util';
import { parseFilterContent } from 'src/engine/api/rest/input-request-parsers/filter-parser-utils/parse-filter-content.util';
import {
  RestInputRequestParserException,
  RestInputRequestParserExceptionCode,
} from 'src/engine/api/rest/input-request-parsers/rest-input-request-parser.exception';

// Logical conjunctions recognized in the REST filter DSL.
export enum Conjunctions {
  or = 'or',
  and = 'and',
  not = 'not',
}

// Matches a filter query string that's wholly wrapped by one root-level
// conjunction, e.g. `and(...)`.
export const ROOT_FILTER_CONJUNCTION_REGEX = new RegExp(
  `^(${Object.values(Conjunctions).join('|')})\\((.+)\\)$`,
);

// Recursively parses a REST filter query string into an
// ObjectRecordFilter-shaped object: a conjunction wrapper recurses into
// its predicates, while a leaf expression is parsed into a nested
// field-path -> operator -> value structure.
export const parseFilter = (
  filterQuery: string,
): Record<string, FieldValue> => {
  const result = {};
  const match = filterQuery.match(ROOT_FILTER_CONJUNCTION_REGEX);

  if (match) {
    const conjunction = match?.[1];

    if (!conjunction) {
      throw new BadRequestException(
        'Error while matching filter query. Conjunction not found',
      );
    }
    const subResult = parseFilterContent(filterQuery).map((elem) =>
      parseFilter(elem),
    );

    if (conjunction === Conjunctions.not) {
      if (subResult.length > 1) {
        throw new RestInputRequestParserException(
          `'filter' invalid. 'not' conjunction should contain only 1 condition. eg: not(field[eq]:1)`,
          RestInputRequestParserExceptionCode.INVALID_FILTER_QUERY_PARAM,
          { userFriendlyMessage: msg`Invalid filter parameter.` },
        );
      }
      // @ts-expect-error legacy noImplicitAny
      result[conjunction] = subResult[0];
    } else {
      // @ts-expect-error legacy noImplicitAny
      result[conjunction] = subResult;
    }

    return result;
  }
  const { fields, comparator, value } = parseBaseFilter(filterQuery);

  const formattedValue = formatFieldValue(value, undefined, comparator);

  return fields.reverse().reduce(
    (acc, currentValue) => {
      return { [currentValue]: acc };
    },
    { [comparator]: formattedValue },
  );
};
