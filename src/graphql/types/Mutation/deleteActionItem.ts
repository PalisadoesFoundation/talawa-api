import { eq } from "drizzle-orm";
import { actionItems } from "~/src/drizzle/tables/actions";
import { builder } from "~/src/graphql/builder";
import { ActionItem } from "~/src/graphql/types/ActionItem/ActionItem";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { MutationDeleteActionItemInput } from "../../inputs/MutationDeleteActionItemInput";
import { mutationDeleteActionItemArgumentsSchema } from "../../inputs/MutationDeleteActionItemInput";

builder.mutationField("deleteActionItem", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Delete an action item",
				required: true,
				type: MutationDeleteActionItemInput,
			}),
		},
		description: "Mutation field to delete an action item.",
		resolve: async (_parent, args, ctx) => {
			// Check if the client is authenticated
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			// Validate the input arguments using Zod
			const {
				data: parsedArgs,
				error,
				success,
			} = mutationDeleteActionItemArgumentsSchema.safeParse(args);

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

			// Fetch the current user and the existing action item concurrently
			const [currentUser, existingActionItem] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.actionItems.findFirst({
					columns: {
						organizationId: true,
					},
					// Adjust the 'with' and 'where' clauses as needed for your relationships and permissions
					where: (fields, { eq }) => eq(fields.id, parsedArgs.input.id),
				}),
			]);

			if (!currentUser) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

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

			const [deletedActionItem] = await ctx.drizzleClient
				.delete(actionItems)
				.where(eq(actionItems.id, parsedArgs.input.id))
				.returning();

			if (!deletedActionItem) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return deletedActionItem;
		},
		type: ActionItem,
	}),
);
