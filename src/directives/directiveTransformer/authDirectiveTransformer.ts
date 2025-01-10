import { MapperKind, getDirective, mapSchema } from "@graphql-tools/utils";
import { defaultFieldResolver } from "graphql";
import type { GraphQLSchema } from "graphql/type/schema";
import { errors, requestContext } from "../../libraries";

/**
 * A function to transform a GraphQL schema by adding authentication logic
 * to the fields with the specified directive.
 *
 * @param schema - The original GraphQL schema to be transformed.
 * @param directiveName - The name of the directive that will trigger the transformation.
 *
 * @see Parent File:
 * - `src/index.ts`
 *
 * @returns A new GraphQL schema with the authentication logic applied.
 *
 * @example
 * `const transformedSchema = authDirectiveTransformer(originalSchema, 'auth');`
 */

function authDirectiveTransformer(
  schema: GraphQLSchema,
  directiveName: string,
): GraphQLSchema {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      // Check whether this field has the specified directive
      const authDirective = getDirective(
        schema,
        fieldConfig,
        directiveName,
      )?.[0];

      if (authDirective) {
        const { resolve = defaultFieldResolver } = fieldConfig;

        fieldConfig.resolve = (root, args, context, info): string => {
          // Check if the user is authenticated and the session is not expired
          if (context.expired || !context.isAuth) {
            throw new errors.UnauthenticatedError(
              requestContext.translate("user.notAuthenticated"),
              "user.notAuthenticated --auth directive",
              "userAuthentication",
            );
          }

          // Call the original resolver with the context
          return resolve(root, args, context, info) as string;
        };

        return fieldConfig;
      }
    },
  });
}

export default authDirectiveTransformer;
