// ActionItemCategoryOrganizationResolver.ts

import { Organization } from "~/src/graphql/types/Organization/Organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { ActionItemCategory } from "./ActionItemCategory";

ActionItemCategory.implement({
	fields: (t) => ({
		organization: t.field({
			description:
				"Fetch the organization associated with this action item category.",
			type: Organization,
			nullable: false, // Adjust if your organization field can be null
			resolve: async (parent, _args, ctx) => {
				// Ensure the category has an organizationId; if not, throw an error.
				if (!parent.organizationId) {
					ctx.log.error("Action item category is missing an organizationId.");
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected", // Using an allowed error code.
						},
					});
				}

				// Query the organizationsTable using the provided organizationId.
				const existingOrganization =
					await ctx.drizzleClient.query.organizationsTable.findFirst({
						where: (fields, operators) =>
							operators.eq(fields.id, parent.organizationId),
					});

				// If no organization is found, log an error and throw an exception.
				if (!existingOrganization) {
					ctx.log.error(
						`Postgres select operation returned no row for action item category's organizationId: ${parent.organizationId}.`,
					);
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected", // Using the allowed error code.
						},
					});
				}

				// Return the organization that was found.
				return existingOrganization;
			},
		}),
	}),
});
