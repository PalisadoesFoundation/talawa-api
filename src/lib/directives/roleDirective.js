const { SchemaDirectiveVisitor } = require('apollo-server-express');
const { defaultFieldResolver } = require('graphql');
const { UnauthenticatedError } = require('../helper_lib/errors');
const requestContext = require('../helper_lib/request-context');
const { userExists } = require('../helper_functions/userExists');

class RoleAuthorizationDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
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

module.exports = RoleAuthorizationDirective;
