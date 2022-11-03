import { SchemaDirectiveVisitor } from "apollo-server-express";
import {
  defaultFieldResolver,
  GraphQLField,
  GraphQLInterfaceType,
  GraphQLObjectType,
} from "graphql";
import {
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_PARAM,
} from "../../constants";
import { errors, requestContext } from "../libraries";
import { User } from "../models";

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
      const currentUser = await User.findOne({
        _id: context.userId,
      }).lean();

      if (!currentUser) {
        throw new errors.NotFoundError(
          requestContext.translate(USER_NOT_FOUND_MESSAGE),
          USER_NOT_FOUND_CODE,
          USER_NOT_FOUND_PARAM
        );
      }

      if (currentUser.userType !== requires) {
        throw new errors.UnauthenticatedError(
          requestContext.translate("user.notAuthenticated"),
          "user.notAuthenticated",
          "userAuthentication"
        );
      }

      context.user = currentUser;

      return resolver(root, args, context, info);
    };
  }
}
