import { GraphQLFieldConfig } from "graphql";
import { USER_NOT_AUTHORIZED_ERROR, USER_NOT_FOUND_ERROR } from "../../constants";
import { errors } from "../../libraries";
import { User } from "../../models";
import { MapperKind, getDirective, mapSchema } from "@graphql-tools/utils";


//@ts-ignore
function roleDirectiveTransformer(schema, directiveName) {
    return mapSchema(schema, {
      [MapperKind.OBJECT_FIELD]: (
        fieldConfig: GraphQLFieldConfig<any, any>
      ): any => {
        // Check whether this field has the specified directive
        const roleDirective = getDirective(
          schema,
          fieldConfig,
          directiveName
        )?.[0];
  
        if (roleDirective) {
          //@ts-ignore
  
          const { resolve = defaultFieldResolver } = fieldConfig;
  
          const { requires } = roleDirective;        
  
          fieldConfig.resolve = async (root, args, context, info): Promise<string> => {
            const currentUser = await User.findOne({
              _id: context.userId,
            }).lean();
      
            if (!currentUser) {
              throw new errors.NotFoundError(
                USER_NOT_FOUND_ERROR.MESSAGE,
                USER_NOT_FOUND_ERROR.CODE,
                USER_NOT_FOUND_ERROR.PARAM
              );
            }
      
            if (currentUser.userType !== requires) {
              throw new errors.UnauthenticatedError(
                USER_NOT_AUTHORIZED_ERROR.MESSAGE,
                USER_NOT_AUTHORIZED_ERROR.CODE,
                USER_NOT_AUTHORIZED_ERROR.PARAM
              );
            }
      
            context.user = currentUser;
      
            return resolve(root, args, context, info);
          };
  
  
  
          return fieldConfig;
        }
      },
    });
  }


  export default roleDirectiveTransformer;