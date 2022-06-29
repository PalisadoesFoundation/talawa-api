import { SchemaDirectiveVisitor } from 'apollo-server-express';
import {
  defaultFieldResolver,
  GraphQLField,
  GraphQLInterfaceType,
} from 'graphql';
import { UnauthenticatedError } from '../helper_lib/errors';
import requestContext from '../helper_lib/request-context';
import { userExists } from '../helper_functions';
import { GraphQLObjectType } from 'graphql';

export class RoleAuthorizationDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(
    field: GraphQLField<any, any>,
    /*
    In typescript '_' as prefix of a function argument means that argument is
    never used in the function definition. When the argument finds it's use
    in the function definition '_' should be removed from the argument.
    */
    _details: {
      objectType: GraphQLObjectType | GraphQLInterfaceType;
    }
  ): GraphQLField<any, any> | void | null {
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
