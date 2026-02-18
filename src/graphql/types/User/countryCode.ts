import type { z } from "zod";
import type { iso3166Alpha2CountryCodeEnum } from "~/src/drizzle/enums/iso3166Alpha2CountryCode";
import { Iso3166Alpha2CountryCode } from "~/src/graphql/enums/Iso3166Alpha2CountryCode";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { GraphQLContext } from "../../context";
import type { User as UserType } from "./User";
import { User } from "./User";

/**
 * Resolver for the `countryCode` field of the `User` type.
 *
 * This function retrieves the country code of a user. It enforces authorization rules:
 * - The user must be authenticated.
 * - The user must be the same as the parent user or an administrator.
 *
 * @param parent - The parent `User` object.
 * @param _args - The arguments for the field (unused).
 * @param ctx - The GraphQL context containing the current client and Drizzle client.
 * @returns The ISO 3166 Alpha-2 country code of the user, or null.
 * @throws {TalawaGraphQLError} if the user is unauthenticated or unauthorized.
 */
export const UserCountryCodeResolver = async (
	parent: UserType,
	_args: unknown,
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

	try {
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

		return parent.countryCode as z.infer<
			typeof iso3166Alpha2CountryCodeEnum
		> | null;
	} catch (error) {
		if (error instanceof TalawaGraphQLError) {
			throw error;
		}

		ctx.log.error(error);
		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}
};

User.implement({
	fields: (t) => ({
		countryCode: t.field({
			description: "Country code of the country the user is a citizen of.",
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			nullable: true,
			resolve: UserCountryCodeResolver,
			type: Iso3166Alpha2CountryCode,
		}),
	}),
});
