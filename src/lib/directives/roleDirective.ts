import { SchemaDirectiveVisitor } from 'apollo-server-express';
import { defaultFieldResolver, GraphQLField } from 'graphql';
import { UnauthenticatedError } from '../helper_lib/errors';
import requestContext from '../helper_lib/request-context';
import { userExists } from '../helper_functions';

export class RoleAuthorizationDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field: GraphQLField<any, any>) {
    const resolver = field.resolve || defaultFieldResolver;

    const { requires } = this.args;

    field.resolve = async (root, args, context, info) => {
      const user = await userExists(context.userId);

      if (user.userType !== requires) {
        throw new UnauthenticatedError(
          requestContext.translate('user.notAuthenticated'),
          'user.notAuthenticated',
          'userAuthentication'
        );
      }

      context.user = user;

      return resolver(root, args, context, info);
    };
  }
}
