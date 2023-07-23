import { MapperKind, getDirective, mapSchema } from "@graphql-tools/utils";
import {
  defaultFieldResolver,
  type GraphQLFieldConfig,
  type GraphQLSchema,
} from "graphql";
import { errors, requestContext } from "../../libraries";

function authDirectiveTransformer(
  schema: GraphQLSchema,
  directiveName: string
): GraphQLSchema {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (
      fieldConfig: GraphQLFieldConfig<any, any>
    ): any => {
      // Check whether this field has the specified directive
      const authDirective = getDirective(
        schema,
        fieldConfig,
        directiveName
      )?.[0];
      if (authDirective) {
        const { resolve = defaultFieldResolver } = fieldConfig;

        fieldConfig.resolve = (root, args, context, info): any => {
          if (context.expired || !context.isAuth)
            throw new errors.UnauthenticatedError(
              requestContext.translate("user.notAuthenticated"),
              "user.notAuthenticated --auth directive",
              "userAuthentication"
            );
          return resolve(root, args, context, info);
        };
        return fieldConfig;
      }
    },
  });
}

export default authDirectiveTransformer;
