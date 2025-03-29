import type { InferSelectModel } from "drizzle-orm";
import { and, ilike, sql } from "drizzle-orm";
import type { organizationsTable } from "~/src/drizzle/schema";
import { builder } from "~/src/graphql/builder";
import type { GraphQLContext } from "~/src/graphql/context";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";

// Define type for organization model
type OrganizationType = InferSelectModel<typeof organizationsTable>;

// Define the expected arguments for the query.
interface OrganizationsArgs {
	filter?: string | null;
	limit?: number | null;
	offset?: number | null;
}

/**
 * Resolver to fetch organizations with optional filtering.
 */
export const resolveOrganizations = async (
	_parent: unknown,
	args: OrganizationsArgs,
	ctx: GraphQLContext,
): Promise<OrganizationType[]> => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const { filter, limit, offset } = args; // No default values to allow fetching all records
	const currentUserId = ctx.currentClient.user.id;

	try {
		// Get current user with their role and organization memberships
		const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
			columns: {
				role: true,
			},
			where: (fields, operators) => operators.eq(fields.id, currentUserId),
		});

		if (!currentUser) {
			throw new TalawaGraphQLError({
				extensions: {
					code: "unauthenticated",
				},
			});
		}

		// Case 1: If user is an administrator, return all organizations
		if (currentUser.role === "administrator") {
			return ctx.drizzleClient.query.organizationsTable.findMany({
				where: (fields) =>
					filter ? ilike(fields.name, `%${filter}%`) : sql`TRUE`,
				limit: limit ?? undefined, // Fetch all if limit is not provided
				offset: offset ?? undefined, // No offset if not provided
			});
		}

		// Case 2: If user is regular, check if they are an admin in any organizations
		const adminMemberships =
			await ctx.drizzleClient.query.organizationMembershipsTable.findMany({
				columns: {
					organizationId: true,
				},
				where: (fields, operators) =>
					and(
						operators.eq(fields.memberId, currentUserId),
						operators.eq(fields.role, "administrator"),
					),
			});

		// If they're an admin in any organization, return only those organizations
		if (adminMemberships.length > 0) {
			const orgIds = adminMemberships.map(
				(membership) => membership.organizationId,
			);

			return ctx.drizzleClient.query.organizationsTable.findMany({
				where: (fields, operators) =>
					and(
						filter ? ilike(fields.name, `%${filter}%`) : sql`TRUE`,
						operators.inArray(fields.id, orgIds),
					),
				limit: limit ?? undefined, // Fetch all if limit is not provided
				offset: offset ?? undefined, // No offset if not provided
			});
		}

		// Case 3: Regular user with no admin privileges, return all organizations
		return ctx.drizzleClient.query.organizationsTable.findMany({
			where: (fields) =>
				filter ? ilike(fields.name, `%${filter}%`) : sql`TRUE`,
			limit: limit ?? undefined, // Fetch all if limit is not provided
			offset: offset ?? undefined, // No offset if not provided
		});
	} catch (error) {
		ctx.log.error("Error in organizations query:", error);
		throw new Error("An error occurred while fetching organizations.");
	}
};

builder.queryField("organizations", (t) =>
	t.field({
		description:
			"Query to fetch all organizations with optional filtering. If limit and offset are not provided, returns all organizations.",
		args: {
			filter: t.arg.string({ required: false }),
			limit: t.arg.int({ required: false }),
			offset: t.arg.int({ required: false }),
		},
		complexity: envConfig.API_GRAPHQL_NON_PAGINATED_LIST_FIELD_COST,
		resolve: resolveOrganizations,
		type: [Organization],
	}),
);
