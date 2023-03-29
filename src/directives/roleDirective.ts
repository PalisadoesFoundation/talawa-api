import { SchemaDirectiveVisitor } from "apollo-server-express";
import {
  defaultFieldResolver,
  GraphQLField,
} from "graphql";
import { USER_NOT_AUTHORIZED_ERROR, USER_NOT_FOUND_ERROR } from "../constants";
import { errors, requestContext } from "../libraries";
import { User } from "../models";

export class RoleAuthorizationDirective extends SchemaDirectiveVisitor {
  /**
   * This function authenticates the role of the user and if not validated, then throws an Unauthenticated Error.
   * @param field - GraphQLField
   * @param  _details - Object
   * @returns resolver function
   */
  visitFieldDefinition(
    field: GraphQLField<any, any>,
    /*
    In typescript '_' as prefix of a function argument means that argument is
    never used in the function definition. When the argument finds it's use
    in the function definition '_' should be removed from the argument.
    */
    // uncomment below when _details needs to be used
    // _details: {
    //   objectType: GraphQLObjectType | GraphQLInterfaceType;
    // }
  ): GraphQLField<any, any> | void | null {
    const resolver = field.resolve || defaultFieldResolver;

    const { requires } = this.args;

    field.resolve = async (root, args, context, info) => {
      const currentUser = await User.findOne({
        _id: context.userId,
      }).lean();

      if (!currentUser) {
        throw new errors.NotFoundError(
          requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
          USER_NOT_FOUND_ERROR.CODE,
          USER_NOT_FOUND_ERROR.PARAM
        );
      }

      if (currentUser.userType !== requires) {
        throw new errors.UnauthenticatedError(
          requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
          USER_NOT_AUTHORIZED_ERROR.CODE,
          USER_NOT_AUTHORIZED_ERROR.PARAM
        );
      }

      context.user = currentUser;

      return resolver(root, args, context, info);
    };
  }
}
