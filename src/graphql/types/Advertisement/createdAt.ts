import type { SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import type { GraphQLContext } from "~/src/graphql/context";
import type {
	organizationMembershipsTable,
	usersTable,
} from "~/src/drizzle/schema";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import {
	Advertisement,
	type Advertisement as AdvertisementType,
} from "./Advertisement";

export const createdAtResolver = async (
	parent: AdvertisementType,
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

	if (!ctx.currentClient.user?.id) {
    throw new TalawaGraphQLError({
      extensions: { code: "unauthenticated" },
    });
    }
    const currentUserId = ctx.currentClient.user.id;

	const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
		columns: {
			role: true,
		},
		with: {
			organizationMembershipsWhereMember: {
				columns: {
					role: true,
				},
				where: (
					fields: typeof organizationMembershipsTable.$inferSelect,
					operators: { eq: (column: PgColumn, value: unknown) => SQL },
				) => operators.eq(fields.organizationId, parent.organizationId),
			},
		},
		where: (
			fields: typeof usersTable.$inferSelect,
			operators: { eq: (column: PgColumn, value: unknown) => SQL },
		) => operators.eq(fields.id, currentUserId),
	});

	if (currentUser === undefined) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const isSystemAdmin = currentUser.role === "administrator";
	const isOrgAdmin =
		currentUser.organizationMembershipsWhereMember?.some(
			(m: { role: string }) => m.role === "administrator",
		) === true;

	if (!isSystemAdmin && !isOrgAdmin) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthorized_action",
			},
		});
	}

	return parent.createdAt;
};

Advertisement.implement({
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	fields: (t: any) => ({
		createdAt: t.field({
			description: "Date time at the time the advertisement was created.",
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			resolve: createdAtResolver,
			type: "DateTime",
		}),
	}),
});
