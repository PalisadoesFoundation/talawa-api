import { z } from "zod";
import { actionItemExceptionsTable } from "~/src/drizzle/tables/actionItemExceptions";
import { builder } from "~/src/graphql/builder";
import { ActionItem } from "~/src/graphql/types/ActionItem/ActionItem";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const MutationCompleteActionForInstanceInput = builder.inputType(
	"MutationCompleteActionForInstanceInput",
	{
		fields: (t) => ({
			actionId: t.id({ required: true }),
			eventId: t.id({ required: true }),
			postCompletionNotes: t.string({ required: true }),
		}),
	},
);

const mutationCompleteActionForInstanceArgumentsSchema = z.object({
	input: z.object({
		actionId: z.string(),
		eventId: z.string(),
		postCompletionNotes: z.string().min(1),
	}),
});

builder.mutationField("completeActionForInstance", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Complete an action item for a single instance",
				required: true,
				type: MutationCompleteActionForInstanceInput,
			}),
		},
		description: "Mutation to complete an action item for a single instance",
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
			} = mutationCompleteActionForInstanceArgumentsSchema.safeParse(args);

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

			const { actionId, eventId, postCompletionNotes } = parsedArgs.input;

			ctx.log.info(
				`Attempting to complete action item for instance. actionId: ${actionId}, eventId: ${eventId}`,
			);

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

			const [createdActionException] = await ctx.drizzleClient
				.insert(actionItemExceptionsTable)
				.values({
					actionId,
					eventId,
					completed: true,
					postCompletionNotes: postCompletionNotes,
				})
				.onConflictDoUpdate({
					target: [
						actionItemExceptionsTable.actionId,
						actionItemExceptionsTable.eventId,
					],
					set: {
						completed: true,
						postCompletionNotes: postCompletionNotes,
					},
				})
				.returning();

			if (!createdActionException) {
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
