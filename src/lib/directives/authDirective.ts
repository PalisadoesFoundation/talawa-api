import { SchemaDirectiveVisitor } from 'apollo-server-express';
import { GraphQLInterfaceType, GraphQLObjectType } from 'graphql';
import { defaultFieldResolver, GraphQLField } from 'graphql';
import { UnauthenticatedError } from '../libraries/errors';
import requestContext from '../libraries/request-context';

export class AuthenticationDirective extends SchemaDirectiveVisitor {
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
