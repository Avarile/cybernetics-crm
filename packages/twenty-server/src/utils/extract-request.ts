import { type ExecutionContext } from '@nestjs/common';
import { type GqlContextType, GqlExecutionContext } from '@nestjs/graphql';

// Extracts the underlying request object from a Nest execution context,
// handling HTTP, GraphQL (including subscription connection context) and RPC.
export const getRequest = (context: ExecutionContext) => {
  let request;

  // if context is an http request
  if (context.getType() === 'http') {
    request = context.switchToHttp().getRequest();
  } else if (context.getType<GqlContextType>() === 'graphql') {
    // if context is a graphql request
    const graphQLContext = GqlExecutionContext.create(context);

    const { req, connection } = graphQLContext.getContext();

    request =
      connection && connection.context && connection.context.headers
        ? connection.context
        : req;
  } else if (context.getType() === 'rpc') {
    // if context is a rpc request
    throw new Error('Not implemented');
  }

  return request;
};
