import type { InferSelectModel } from "drizzle-orm";
import type { organizationsTable } from "~/src/drizzle/schema";
import { builder } from "~/src/graphql/builder";
import { Organization } from "~/src/graphql/types/Organization/Organization";

// Define type for organization model
type OrganizationType = InferSelectModel<typeof organizationsTable>;

builder.queryField("organizations", (t) =>
	t.field({
		description:
			"Query to fetch all organizations. Returns up to 20 organizations.",

		resolve: async (_parent, args, ctx): Promise<OrganizationType[]> => {
			try {
				// Fetch organizations (limit 20)
				const organizations =
					await ctx.drizzleClient.query.organizationsTable.findMany({
						limit: 20,
					});

				// Return the fetched organizations
				return organizations;
			} catch (error) {
				// Log the error for debugging
				console.error("Error in organizations query:", error);

				// Throw a generic error message
				throw new Error("An error occurred while fetching organizations.");
			}
		},
		type: [Organization],
	}),
);
