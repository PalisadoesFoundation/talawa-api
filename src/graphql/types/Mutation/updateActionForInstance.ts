import { z } from "zod";
import { actionExceptionsTable } from "../../../drizzle/tables/actionExceptions";
import { builder } from "../../../graphql/builder";
import { TalawaGraphQLError } from "../../../utilities/TalawaGraphQLError";
import { ActionItem } from "../ActionItem/ActionItem";

const MutationUpdateActionForInstanceInput = builder.inputType(
	"MutationUpdateActionForInstanceInput",
	{
		fields: (t) => ({
			actionId: t.id({ required: true }),
			eventId: t.id({ required: true }),
			assigneeId: t.id({ required: false }),
			categoryId: t.id({ required: false }),
			assignedAt: t.string({ required: false }),
			preCompletionNotes: t.string({ required: false }),
		}),
	},
);

const mutationUpdateActionForInstanceArgumentsSchema = z.object({
	input: z.object({
		actionId: z.string().uuid(),
		eventId: z.string().uuid(),
		assigneeId: z.string().uuid().optional(),
		categoryId: z.string().uuid().optional(),
		assignedAt: z.string().optional(),
		preCompletionNotes: z.string().optional(),
	}),
});

builder.mutationField("updateActionForInstance", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Update an action item for a single instance",
				required: true,
				type: MutationUpdateActionForInstanceInput,
			}),
		},
		description: "Mutation to update an action item for a single instance",
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
			} = mutationUpdateActionForInstanceArgumentsSchema.safeParse(args);

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

			const {
				actionId,
				eventId,
				assigneeId,
				categoryId,
				assignedAt,
				preCompletionNotes,
			} = parsedArgs.input;

			const [existingActionItem, existingEventInstance] = await Promise.all([
				ctx.drizzleClient.query.actionsTable.findFirst({
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

			interface UpdateValues {
				actionId: string;
				eventId: string;
				assigneeId?: string;
				categoryId?: string;
				assignedAt?: Date;
				preCompletionNotes?: string;
			}

			interface SetValues {
				assigneeId?: string;
				categoryId?: string;
				assignedAt?: Date;
				preCompletionNotes?: string;
			}

			const updateValues: UpdateValues = {
				actionId,
				eventId,
			};

			// Only include fields that are provided
			if (assigneeId !== undefined) updateValues.assigneeId = assigneeId;
			if (categoryId !== undefined) updateValues.categoryId = categoryId;
			if (assignedAt !== undefined)
				updateValues.assignedAt = new Date(assignedAt);
			if (preCompletionNotes !== undefined)
				updateValues.preCompletionNotes = preCompletionNotes;

			const setValues: SetValues = {};
			if (assigneeId !== undefined) setValues.assigneeId = assigneeId;
			if (categoryId !== undefined) setValues.categoryId = categoryId;
			if (assignedAt !== undefined) setValues.assignedAt = new Date(assignedAt);
			if (preCompletionNotes !== undefined)
				setValues.preCompletionNotes = preCompletionNotes;

			const [updatedActionException] = await ctx.drizzleClient
				.insert(actionExceptionsTable)
				.values(updateValues)
				.onConflictDoUpdate({
					target: [
						actionExceptionsTable.actionId,
						actionExceptionsTable.eventId,
					],
					set: setValues,
				})
				.returning();

			if (!updatedActionException) {
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
