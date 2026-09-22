import { Catch, type ExceptionFilter } from '@nestjs/common';

import { PermissionsException } from 'src/engine/metadata-modules/permissions/permissions.exception';
import { permissionGraphqlApiExceptionHandler } from 'src/engine/metadata-modules/permissions/utils/permission-graphql-api-exception-handler.util';

// Routes PermissionsException instances thrown in GraphQL resolvers through the shared handler.
@Catch(PermissionsException)
export class PermissionsGraphqlApiExceptionFilter implements ExceptionFilter {
  catch(exception: PermissionsException) {
    return permissionGraphqlApiExceptionHandler(exception);
  }
}
