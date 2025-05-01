import { eq } from "drizzle-orm";
import { actionItemsTable } from "~/src/drizzle/tables/actionItems";
import { builder } from "~/src/graphql/builder";
import { ActionItem } from "~/src/graphql/types/ActionItem/actionItem";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { MutationDeleteActionItemInput } from "../../inputs/MutationDeleteActionItemInput";
import { mutationDeleteActionItemArgumentsSchema } from "../../inputs/MutationDeleteActionItemInput";

// Defines a GraphQL mutation field named `deleteActionItem`
builder.mutationField("deleteActionItem", (t) =>
	t.field({
		// Define mutation arguments
		args: {
			input: t.arg({
				description: "Delete an action item",
				required: true,
				type: MutationDeleteActionItemInput,
			}),
		},
		description: "Mutation field to delete an action item.",
		resolve: async (_parent, args, ctx) => {
			// Step 1: Authentication check – Ensure the client is logged in
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			// Step 2: Validate the input against the schema using Zod
			const {
				data: parsedArgs,
				error,
				success,
			} = mutationDeleteActionItemArgumentsSchema.safeParse(args);

			// If validation fails, throw a structured error with details
			if (!success) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: error.issues.map((issue) => ({
							argumentPath: issue.path,
							message: issue.message,
						})),
					},
				});
			}

			const currentUserId = ctx.currentClient.user.id;

			// Step 3: Fetch both the current user and the action item to be deleted
			const [currentUser, existingActionItem] = await Promise.all([
				// Fetch the current user's role for authorization logic
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				// Fetch the action item targeted for deletion
				ctx.drizzleClient.query.actionItemsTable.findFirst({
					columns: {
						organizationId: true,
					},
					where: (fields, { eq }) => eq(fields.id, parsedArgs.input.id),
				}),
			]);

			// If the user isn't found (should not happen if authenticated), throw error
			if (!currentUser) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			// If the specified action item doesn't exist, throw not found error
			if (!existingActionItem) {
				throw new TalawaGraphQLError({
					message: "The specified action item does not exist.",
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "id"],
							},
						],
					},
				});
			}

			// Step 4: Delete the action item and return the deleted row
			const [deletedActionItem] = await ctx.drizzleClient
				.delete(actionItemsTable)
				.where(eq(actionItemsTable.id, parsedArgs.input.id))
				.returning();

			// If deletion failed silently, throw an unexpected error
			if (!deletedActionItem) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			// Return the deleted action item to the client
			return deletedActionItem;
		},
		type: ActionItem,
	}),
);
