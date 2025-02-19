import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { builder } from "~/src/graphql/builder";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { Organization } from "./Organization";

builder.queryField("getAllOrganization", (t) =>
	t.field({
		type: [Organization], // List of organizations
		description: "Fetch all organizations from the database.",
		resolve: async (_parent, _args, ctx) => {
			try {
				console.log("inside dddddddddd");

				const organizations = await ctx.drizzleClient
					.select()
					.from(organizationsTable);

				if (!organizations || organizations.length === 0) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action",
							issues: [
								{
									message: "No organizations found in the database.",
								},
							],
						},
					});
				}

				return organizations;
			} catch (error) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
						issues: [
							{
								message:
									"An unexpected error occurred while fetching organizations.",
								details:
									error instanceof Error ? error.message : "Unknown error",
							},
						],
					},
				});
			}
		},
	}),
);
