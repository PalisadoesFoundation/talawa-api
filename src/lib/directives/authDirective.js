const { SchemaDirectiveVisitor } = require('apollo-server-express');
const { defaultFieldResolver } = require('graphql');
const { UnauthenticatedError } = require('../helper_lib/errors');
const requestContext = require('../helper_lib/request-context');

class AuthenticationDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
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

module.exports = AuthenticationDirective;
