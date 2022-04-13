const { SchemaDirectiveVisitor } = require('apollo-server-express');
const { UnauthenticatedError } = require('errors');
const { defaultFieldResolver } = require('graphql');
const {
  NOT_AUTHENTICATED_USER_MESSAGE,
  NOT_AUTHENTICATED_USER_PARAM,
  NOT_AUTHENTICATED_USER_CODE,
} = require('../../constants');
const requestContext = require('talawa-request-context');

class AuthenticationDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const resolver = field.resolve || defaultFieldResolver;
    field.resolve = async (root, args, context, info) => {
      if (context.expired || !context.isAuth)
        throw new UnauthenticatedError(
          requestContext.translate(NOT_AUTHENTICATED_USER_MESSAGE),
          NOT_AUTHENTICATED_USER_CODE,
          NOT_AUTHENTICATED_USER_PARAM
        );

      return resolver(root, args, context, info);
    };
  }
}

module.exports = AuthenticationDirective;
