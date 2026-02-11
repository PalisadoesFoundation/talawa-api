import type { z } from "zod";
import type { iso639Set1LanguageCodeEnum } from "~/src/drizzle/enums/iso639Set1LanguageCode";
import type { GraphQLContext } from "~/src/graphql/context";
import { Iso639Set1LanguageCode } from "~/src/graphql/enums/Iso639Set1LanguageCode";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { User as UserType } from "./User";
import { User } from "./User";

/**
 * Resolves the naturalLanguageCode field on the User type.
 * Requires authentication and either administrator role or self-access.
 *
 * @param parent - The User parent object containing the naturalLanguageCode field.
 * @param _args - GraphQL arguments (unused).
 * @param ctx - The GraphQL context containing authentication state and database client.
 * @returns The user's preferred natural language code, or null if not set.
 * @throws TalawaGraphQLError with code "unauthenticated" if the client is not authenticated or the user is not found.
 * @throws TalawaGraphQLError with code "unauthorized_action" if a non-admin user tries to access another user's data.
 */
export const resolveNaturalLanguageCode = async (
	parent: UserType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
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

	if (currentUser.role !== "administrator" && parent.id !== currentUserId) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthorized_action",
			},
		});
	}

	return parent.naturalLanguageCode as z.infer<
		typeof iso639Set1LanguageCodeEnum
	> | null;
};

User.implement({
	fields: (t) => ({
		naturalLanguageCode: t.field({
			description: "Language code of the user's preferred natural language.",
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			nullable: true,
			resolve: resolveNaturalLanguageCode,
			type: Iso639Set1LanguageCode,
		}),
	}),
});
