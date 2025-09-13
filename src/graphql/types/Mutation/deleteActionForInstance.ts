import { z } from "zod";
import { actionItemExceptionsTable } from "../../../drizzle/tables/actionItemExceptions";
import { builder } from "../../../graphql/builder";
import { TalawaGraphQLError } from "../../../utilities/TalawaGraphQLError";
import { ActionItem } from "../ActionItem/ActionItem";

const MutationDeleteActionForInstanceInput = builder.inputType(
	"MutationDeleteActionForInstanceInput",
	{
		fields: (t) => ({
			actionId: t.id({ required: true }),
			eventId: t.id({ required: true }),
		}),
	},
);

const mutationDeleteActionForInstanceArgumentsSchema = z.object({
	input: z.object({
		actionId: z.string().uuid(),
		eventId: z.string().uuid(),
	}),
});

builder.mutationField("deleteActionForInstance", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Delete an action item for a single instance",
				required: true,
				type: MutationDeleteActionForInstanceInput,
			}),
		},
		description: "Mutation to delete an action item for a single instance",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			const {
				data: parsedArgs,
				error,
				success,
			} = mutationDeleteActionForInstanceArgumentsSchema.safeParse(args);

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

			const { actionId, eventId } = parsedArgs.input;

			const [existingActionItem, existingEventInstance] = await Promise.all([
				ctx.drizzleClient.query.actionItemsTable.findFirst({
					where: (fields, { eq }) => eq(fields.id, actionId),
				}),
				ctx.drizzleClient.query.recurringEventInstancesTable.findFirst({
					where: (fields, { eq }) => eq(fields.id, eventId),
				}),
			]);

			if (!existingActionItem) {
				throw new TalawaGraphQLError({
					message: "The specified action item does not exist.",
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "actionId"],
							},
						],
					},
				});
			}

			if (!existingEventInstance) {
				throw new TalawaGraphQLError({
					message: "The specified event instance does not exist.",
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "eventId"],
							},
						],
					},
				});
			}

			// Create or update exception to mark as deleted for this instance
			const [deletedActionException] = await ctx.drizzleClient
				.insert(actionItemExceptionsTable)
				.values({
					actionId,
					eventId,
					deleted: true,
				})
				.onConflictDoUpdate({
					target: [
						actionItemExceptionsTable.actionId,
						actionItemExceptionsTable.eventId,
					],
					set: {
						deleted: true,
					},
				})
				.returning();

			if (!deletedActionException) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return existingActionItem;
		},
		type: ActionItem,
	}),
);
