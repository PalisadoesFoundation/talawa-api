import { MapperKind, getDirective, mapSchema } from "@graphql-tools/utils";
import type { GraphQLSchema } from "graphql";
import { defaultFieldResolver } from "graphql";
import { USER_NOT_FOUND_ERROR } from "../../constants";
import { errors } from "../../libraries";
import { User } from "../../models";

/**
 * A function to transform a GraphQL schema by adding role-based authorization
 * logic to the fields with the specified directive.
 *
 * @param schema - The original GraphQL schema to be transformed.
 * @param directiveName - The name of the directive that will trigger the transformation.
 *
 * @see Parent File:
 * - `src/index.ts`
 *
 * @returns A new GraphQL schema with the role-based authorization logic applied.
 *
 * @example
 * const transformedSchema = roleDirectiveTransformer(originalSchema, 'role');
 */

function roleDirectiveTransformer(
  schema: GraphQLSchema,
  directiveName: string,
): GraphQLSchema {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      // Check whether this field has the specified directive
      const roleDirective = getDirective(
        schema,
        fieldConfig,
        directiveName,
      )?.[0];

      if (roleDirective) {
        const { resolve = defaultFieldResolver } = fieldConfig;

        // const { requires } = roleDirective;

        fieldConfig.resolve = async (
          root,
          args,
          context,
          info,
        ): Promise<string> => {
          // Fetch the current user from the database using the userId from the context
          const currentUser = await User.findOne({
            _id: context.userId,
          }).lean();

          // If no user is found, throw a "Not Found" error
          if (!currentUser) {
            throw new errors.NotFoundError(
              USER_NOT_FOUND_ERROR.MESSAGE,
              USER_NOT_FOUND_ERROR.CODE,
              USER_NOT_FOUND_ERROR.PARAM,
            );
          }

          // if (currentUser.userType !== requires) {
          //   throw new errors.UnauthenticatedError(
          //     USER_NOT_AUTHORIZED_ERROR.MESSAGE,
          //     USER_NOT_AUTHORIZED_ERROR.CODE,
          //     USER_NOT_AUTHORIZED_ERROR.PARAM
          //   );
          // }

          // Add the current user to the context for use in the resolver
          context.user = currentUser;

          // Call the original resolver with the updated context
          return resolve(root, args, context, info) as string;
        };

        return fieldConfig;
      }
    },
  });
}

export default roleDirectiveTransformer;
