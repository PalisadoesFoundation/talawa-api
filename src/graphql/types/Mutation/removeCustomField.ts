import { eq } from "drizzle-orm"; // Import eq for filtering
import { customFieldsTable } from "~/src/drizzle/tables/customFields";
import { builder } from "~/src/graphql/builder";
import { OrganizationCustomField } from "~/src/graphql/types/Organization/OrganizationCustomField";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

builder.mutationField("removeOrganizationCustomField", (t) =>
	t.field({
		args: {
			id: t.arg.string({ required: true }),
		},
		type: OrganizationCustomField,
		resolve: async (_parent, args, ctx) => {
			const { id } = args;

			// Check if the user is authenticated
			if (!ctx.currentClient.user) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			const currentUserId = ctx.currentClient.user.id;

			// Fetch the current user's role
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

			// Fetch the custom field to ensure it exists
			const customFieldToDelete =
				await ctx.drizzleClient.query.customFieldsTable.findFirst({
					where: (fields, operators) => operators.eq(fields.id, id),
				});

			if (!customFieldToDelete) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						message: "Custom field not found",
						issues: [],
					},
				});
			}

			// Delete the custom field
			const [deletedCustomField] = await ctx.drizzleClient
				.delete(customFieldsTable)
				.where(eq(customFieldsTable.id, id)) // Use eq for filtering
				.returning();

			if (!deletedCustomField) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
						message: "Failed to delete custom field",
					},
				});
			}

			return deletedCustomField;
		},
	}),
);
