import { ArgumentsHost, Catch } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';

import { DatabaseCentreException } from 'src/modules/database-record/exceptions/database-centre.exception';
import { databaseCentreGraphqlApiExceptionHandler } from 'src/modules/database-record/utils/database-centre-graphql-api-exception-handler.util';

@Catch(DatabaseCentreException)
// Maps DatabaseCentreException instances to GraphQL error responses.
export class DatabaseCentreGraphqlApiExceptionFilter implements GqlExceptionFilter {
  catch(exception: DatabaseCentreException, _host: ArgumentsHost) {
    return databaseCentreGraphqlApiExceptionHandler(exception);
  }
}
