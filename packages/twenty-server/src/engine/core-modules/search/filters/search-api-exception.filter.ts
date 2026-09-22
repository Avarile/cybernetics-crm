// GraphQL exception filter that re-throws all known SearchException codes as-is.
import { Catch, type ExceptionFilter } from '@nestjs/common';

import { assertUnreachable } from 'twenty-shared/utils';

import {
  SearchException,
  SearchExceptionCode,
} from 'src/engine/core-modules/search/exceptions/search.exception';

@Catch(SearchException)
export class SearchApiExceptionFilter implements ExceptionFilter {
  constructor() {}

  // Re-throws the exception for every known SearchExceptionCode.
  catch(exception: SearchException) {
    switch (exception.code) {
      case SearchExceptionCode.LABEL_IDENTIFIER_FIELD_NOT_FOUND:
      case SearchExceptionCode.OBJECT_METADATA_NOT_FOUND:
        throw exception;
      default: {
        assertUnreachable(exception.code);
      }
    }
  }
}
