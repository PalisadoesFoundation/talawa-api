import { SchemaDirectiveVisitor } from "apollo-server-express";
import {
  GraphQLInterfaceType,
  GraphQLObjectType,
  defaultFieldResolver,
  GraphQLField,
} from "graphql";
import { errors, requestContext } from "../libraries";

export class AuthenticationDirective extends SchemaDirectiveVisitor {
  /**
   * This function throws an Unauthenticated error if the context is expired or not authenticated.
   * @param field - GraphQLField
   * @param _details - Object
   * @returns resolver function
  */
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
        throw new errors.UnauthenticatedError(
          requestContext.translate("user.notAuthenticated"),
          "user.notAuthenticated",
          "userAuthentication"
        );

      return resolver(root, args, context, info);
    };
  }
}
