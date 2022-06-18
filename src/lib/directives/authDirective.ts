import { SchemaDirectiveVisitor } from 'apollo-server-express';
import { defaultFieldResolver } from 'graphql';
import type { GraphQLField } from 'graphql';
import { UnauthenticatedError } from '../helper_lib/errors';
import requestContext from '../helper_lib/request-context';

export class AuthenticationDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field: GraphQLField<any, any>) {
    const resolver = field.resolve || defaultFieldResolver;

    field.resolve = async (root, args, context, info) => {
      if (context.expired || !context.isAuth)
        throw new UnauthenticatedError(
          requestContext.translate('user.notAuthenticated'),
          'user.notAuthenticated',
          'userAuthentication'
        );

      return resolver(root, args, context, info);
    };
  }
}

export default AuthenticationDirective;
