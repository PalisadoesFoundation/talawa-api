import type { z } from "zod";
import type { iso3166Alpha2CountryCodeEnum } from "~/src/drizzle/enums/iso3166Alpha2CountryCode";
import { Iso3166Alpha2CountryCode } from "~/src/graphql/enums/Iso3166Alpha2CountryCode";
import type { GraphQLContext } from "../../context";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { User as UserType } from "./User";
import { User } from "./User";

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

	return parent.countryCode as z.infer<
		typeof iso3166Alpha2CountryCodeEnum
	> | null;
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
