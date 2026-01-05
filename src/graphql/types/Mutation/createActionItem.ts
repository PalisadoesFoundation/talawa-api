import { sql } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { actionItemsTable } from "~/src/drizzle/tables/actionItems";
import { builder } from "~/src/graphql/builder";
import { ActionItem } from "~/src/graphql/types/ActionItem/ActionItem";
import { firstOrThrow } from "~/src/lib/dbHelpers";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationCreateActionItemArgumentsSchema = z.object({
	input: z
		.object({
			categoryId: z.string().uuid(),
			volunteerId: z.string().uuid().optional(),
			volunteerGroupId: z.string().uuid().optional(),
			preCompletionNotes: z.string().optional(),
			eventId: z.string().uuid().optional(),
			recurringEventInstanceId: z.string().uuid().optional(),
			organizationId: z.string().uuid(),
			assignedAt: z.string().optional(),
			isTemplate: z.boolean().optional(),
		})
		.refine(
			(data) =>
				data.volunteerId !== undefined || data.volunteerGroupId !== undefined,
			{
				message: "Either volunteerId or volunteerGroupId must be provided",
				path: ["volunteerId", "volunteerGroupId"],
			},
		),
});

builder.mutationField("createActionItem", (t) =>
	t.field({
		type: ActionItem,
		args: {
			input: t.arg({
				required: true,
				type: builder.inputType("CreateActionItemInput", {
					fields: (t) => ({
						categoryId: t.field({ type: "ID", required: true }),
						volunteerId: t.field({ type: "ID" }),
						volunteerGroupId: t.field({ type: "ID" }),
						preCompletionNotes: t.field({ type: "String" }),
						eventId: t.field({ type: "ID" }),
						recurringEventInstanceId: t.field({ type: "ID" }),
						organizationId: t.field({ type: "ID", required: true }),
						assignedAt: t.field({ type: "String" }),
						isTemplate: t.field({ type: "Boolean" }),
					}),
				}),
			}),
		},
		description: "Mutation field to create an action item.",
		resolve: async (_parent, args, ctx) => {
			// Log the arguments to inspect the input
			ctx.log.info(args.input, "createActionItem arguments");

			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			const parsedArgs = mutationCreateActionItemArgumentsSchema.parse(args);
			const currentUserId = ctx.currentClient.user.id;

			// Check if the organization exists
			const existingOrganization =
				await ctx.drizzleClient.query.organizationsTable.findFirst({
					columns: { id: true },
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.organizationId),
				});

			if (!existingOrganization) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "organizationId"] }],
					},
				});
			}

			// Check if the user is part of the organization
			const userMembership =
				await ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
					columns: { role: true },
					where: (fields, operators) =>
						sql`${operators.eq(
							fields.memberId,
							currentUserId,
						)} AND ${operators.eq(
							fields.organizationId,
							parsedArgs.input.organizationId,
						)}`,
				});

			if (!userMembership) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [{ argumentPath: ["input", "organizationId"] }],
					},
				});
			}

			const existingCategory =
				await ctx.drizzleClient.query.actionItemCategoriesTable.findFirst({
					columns: { id: true },
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.categoryId),
				});

			if (!existingCategory) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "categoryId"] }],
					},
				});
			}

			// Validate volunteer or volunteer group exists
			if (parsedArgs.input.volunteerId) {
				const existingVolunteer =
					await ctx.drizzleClient.query.eventVolunteersTable.findFirst({
						columns: { id: true },
						where: (fields, operators) =>
							operators.eq(fields.id, parsedArgs.input.volunteerId as string),
					});

				if (!existingVolunteer) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [{ argumentPath: ["input", "volunteerId"] }],
						},
					});
				}
			}

			if (parsedArgs.input.volunteerGroupId) {
				const existingVolunteerGroup =
					await ctx.drizzleClient.query.eventVolunteerGroupsTable.findFirst({
						columns: { id: true },
						where: (fields, operators) =>
							operators.eq(
								fields.id,
								parsedArgs.input.volunteerGroupId as string,
							),
					});

				if (!existingVolunteerGroup) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [{ argumentPath: ["input", "volunteerGroupId"] }],
						},
					});
				}
			}

			if (userMembership.role !== "administrator") {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "organizationId"],
								message:
									"Only administrators can create action items for this organization.",
							},
						],
					},
				});
			}

			const rows = await ctx.drizzleClient
				.insert(actionItemsTable)
				.values({
					id: uuidv7(),
					creatorId: currentUserId,
					categoryId: parsedArgs.input.categoryId,
					volunteerId: parsedArgs.input.volunteerId ?? null,
					volunteerGroupId: parsedArgs.input.volunteerGroupId ?? null,
					assignedAt: parsedArgs.input.assignedAt
						? new Date(parsedArgs.input.assignedAt)
						: new Date(),
					completionAt: null, // Set to null for new action items
					preCompletionNotes: parsedArgs.input.preCompletionNotes ?? null,
					postCompletionNotes: null,
					isCompleted: false,
					eventId: parsedArgs.input.eventId ?? null,
					recurringEventInstanceId:
						parsedArgs.input.recurringEventInstanceId ?? null,
					organizationId: parsedArgs.input.organizationId,
					isTemplate: parsedArgs.input.isTemplate ?? false,
					updatedAt: new Date(),
					updaterId: currentUserId,
				})
				.returning();

			const createdActionItem = firstOrThrow(
				rows,
				"Action item creation failed",
				"unexpected",
			);

			return createdActionItem;
		},
	}),
);
