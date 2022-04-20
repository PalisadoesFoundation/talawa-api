const { SchemaDirectiveVisitor } = require('apollo-server-express');
const { UnauthenticatedError } = require('errors');
const { defaultFieldResolver } = require('graphql');
const requestContext = require('talawa-request-context');

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
