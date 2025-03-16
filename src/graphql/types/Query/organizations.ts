import type { InferSelectModel } from "drizzle-orm";
import { ilike, sql } from "drizzle-orm";
import type { organizationsTable } from "~/src/drizzle/schema";
import { builder } from "~/src/graphql/builder";
import type {
	ExplicitGraphQLContext,
	ImplicitMercuriusContext,
} from "~/src/graphql/context";
import { Organization } from "~/src/graphql/types/Organization/Organization";

// Define type for organization model
type OrganizationType = InferSelectModel<typeof organizationsTable>;

// Define the expected arguments for the query.
interface OrganizationsArgs {
	filter?: string | null;
}

// Combine the explicit and implicit context types.
type ContextType = ExplicitGraphQLContext & ImplicitMercuriusContext;

/**
 * Resolver to fetch organizations with optional filtering.
 */
export const resolveOrganizations = async (
	_parent: unknown,
	args: OrganizationsArgs,
	ctx: ContextType,
): Promise<OrganizationType[]> => {
	const { filter } = args;
	try {
		const organizations =
			await ctx.drizzleClient.query.organizationsTable.findMany({
				where: (fields) =>
					filter ? ilike(fields.name, `%${filter}%`) : sql`TRUE`,
				limit: 20,
				offset: 0,
			});
		return organizations;
	} catch (error) {
		ctx.log.error("Error in organizations query:", error);
		throw new Error("An error occurred while fetching organizations.");
	}
};

builder.queryField("organizations", (t) =>
	t.field({
		description:
			"Query to fetch all organizations with optional filtering. Returns up to 20 organizations.",
		args: {
			filter: t.arg.string({ required: false }),
		},
		resolve: resolveOrganizations,
		type: [Organization],
	}),
);
