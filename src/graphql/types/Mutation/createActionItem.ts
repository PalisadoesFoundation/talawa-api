import { sql } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { z } from "zod";
import { actionsTable } from "~/src/drizzle/tables/actions";
import { builder } from "~/src/graphql/builder";
import { ActionItem } from "~/src/graphql/types/ActionItem/ActionItem";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationCreateActionItemArgumentsSchema = z.object({
	input: z.object({
		categoryId: z.string().uuid(),
		assigneeId: z.string().uuid(),
		preCompletionNotes: z.string().optional(),
		eventId: z.string().uuid().optional(),
		organizationId: z.string().uuid(),
		assignedAt: z.string().optional(),
	}),
});

export const createActionItemMutation = builder.mutationField(
	"createActionItem",
	(t) =>
		t.field({
			type: ActionItem,
			args: {
				input: t.arg({
					required: true,
					type: builder.inputType("CreateActionItemInput", {
						fields: (t) => ({
							categoryId: t.field({ type: "ID", required: true }),
							assigneeId: t.field({ type: "ID", required: true }),
							preCompletionNotes: t.field({ type: "String" }),
							eventId: t.field({ type: "ID" }),
							organizationId: t.field({ type: "ID", required: true }),
							assignedAt: t.field({ type: "String" }), // 🆕 Added assignedAt field
						}),
					}),
				}),
			},
			description: "Mutation field to create an action item.",
			resolve: async (_parent, args, ctx) => {
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: { code: "unauthenticated" },
					});
				}

				const parsedArgs = mutationCreateActionItemArgumentsSchema.parse(args);
				const currentUserId = ctx.currentClient.user.id;

				// **1. Check if the organization exists**
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

				// **2. Check if the user is part of the organization**
				const userMembership =
					await ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
						columns: { role: true },
						where: (fields, operators) =>
							sql`${operators.eq(fields.memberId, currentUserId)} AND ${operators.eq(fields.organizationId, parsedArgs.input.organizationId)}`,
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
					await ctx.drizzleClient.query.actionCategoriesTable.findFirst({
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

				const existingAssignee =
					await ctx.drizzleClient.query.usersTable.findFirst({
						columns: { id: true },
						where: (fields, operators) =>
							operators.eq(fields.id, parsedArgs.input.assigneeId),
					});

				if (!existingAssignee) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [{ argumentPath: ["input", "assigneeId"] }],
						},
					});
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

				const [createdActionItem] = await ctx.drizzleClient
					.insert(actionsTable)
					.values({
						id: uuidv7(),
						creatorId: currentUserId,
						categoryId: parsedArgs.input.categoryId,
						assigneeId: parsedArgs.input.assigneeId,
						assignedAt: parsedArgs.input.assignedAt // 🆕 Using provided assignedAt date
							? new Date(parsedArgs.input.assignedAt)
							: new Date(), // Default to current date if not provided
						completionAt: new Date(),
						preCompletionNotes: parsedArgs.input.preCompletionNotes ?? null,
						postCompletionNotes: null,
						isCompleted: false,
						eventId: parsedArgs.input.eventId ?? null,
						organizationId: parsedArgs.input.organizationId,
						updatedAt: new Date(),
						updaterId: currentUserId,
					})
					.returning();

				if (!createdActionItem) {
					ctx.log.error(
						"Postgres insert operation unexpectedly returned an empty array.",
					);
					throw new TalawaGraphQLError({ extensions: { code: "unexpected" } });
				}

				return createdActionItem;
			},
		}),
);
