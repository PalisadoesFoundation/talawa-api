import envConfig from "~/src/utilities/graphqLimits";
import { escapeHTML } from "~/src/utilities/sanitizer";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { User } from "./User";
import { GraphQLContext } from "../../context";
import { GraphQLError } from "graphql";

/**
 * Resolver for the User.addressLine1 field with access control.
 * Only administrators or the user themselves can access this field.
 *
 * @param parent - The parent User object being resolved
 * @param _args - GraphQL arguments (not used)
 * @param ctx - The GraphQL context 
 * @returns The user's address first line or throws an error if unauthorized
*/
export const addressLine1Resolver = async(
  parent : User,
  _args: Record<string, never>,
  ctx: GraphQLContext

)=> {
    try{
		if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				const currentUserId = ctx.currentClient.user.id;

				const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				});

				if (currentUser === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				if (
					currentUser.role !== "administrator" &&
					parent.id !== currentUserId
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action",
						},
					});
				}

				return escapeHTML(parent.addressLine1);
	}
	
	catch(error){
       if(error instanceof GraphQLError){
		throw error
	   }

	   ctx.log.error(error);

       throw new TalawaGraphQLError({
		message: "internal server error",
		extensions :{
         code :"unexpected" 
		 },
	   });
	}
 };
User.implement({
	fields: (t) => ({
		addressLine1: t.field({
			description: "Address line 1 of the user's address.",
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			resolve:addressLine1Resolver,
			type: "String",
		}),
	}),
});
