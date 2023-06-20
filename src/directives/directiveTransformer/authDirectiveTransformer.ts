import { MapperKind, getDirective, mapSchema } from "@graphql-tools/utils";
import { GraphQLFieldConfig } from "graphql";
import { errors } from "../../libraries";


//@ts-ignore
function authDirectiveTransformer(schema, directiveName) {
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
          //@ts-ignore
          const { resolve = defaultFieldResolver } = fieldConfig;
  
          fieldConfig.resolve = (root, args, context, info): string => {
            if (context.expired || !context.isAuth)
              throw new errors.UnauthenticatedError(
                "user.notAuthenticated --auth directive",
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