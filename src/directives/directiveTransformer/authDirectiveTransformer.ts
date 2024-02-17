import { MapperKind, getDirective, mapSchema } from "@graphql-tools/utils";
import { defaultFieldResolver } from "graphql";
import type { GraphQLSchema } from "graphql/type/schema";
import { errors, requestContext } from "../../libraries";

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
          if (context.expired || !context.isAuth)
            throw new errors.UnauthenticatedError(
              requestContext.translate("user.notAuthenticated"),
              "user.notAuthenticated --auth directive",
              "userAuthentication",
            );
          return resolve(root, args, context, info) as string;
        };
        return fieldConfig;
      }
    },
  });
}

export default authDirectiveTransformer;
