import { sql } from "drizzle-orm";
import { uuidv7 } from "uuidv7";
import { actionItemsTable } from "~/src/drizzle/tables/actionItems";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateActionItemInput,
	mutationCreateActionItemArgumentsSchema,
} from "~/src/graphql/inputs/MutationCreateActionItem";
import { ActionItem } from "~/src/graphql/types/ActionItem/actionItem";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

/**
 * GraphQL mutation to create a new action item.
 * Performs input validation, membership and role checks, and resource existence checks.
 */
export const createActionItemCategoryMutation = builder.mutationField(
	"createActionItem",
	(t) =>
		t.field({
			type: ActionItem,
			description: "Mutation field to create an action item.",
			args: {
				input: t.arg({
					required: true,
					description: "Input for creating an action item.",
					type: MutationCreateActionItemInput,
				}),
			},
			resolve: async (_parent, args, ctx) => {
				// Step 1: Authentication check
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: { code: "unauthenticated" },
					});
				}

				// Step 2: Validate and parse input
				const {
					data: parsedArgs,
					error,
					success,
				} = await mutationCreateActionItemArgumentsSchema.safeParseAsync(args);

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

				// Step 3: Check if the target organization exists
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

				// Step 4: Check if current user is a member of the organization
				const userMembership =
					await ctx.drizzleClient.query.organizationMembershipsTable.findFirst({
						columns: { role: true },
						where: (fields, operators) =>
							sql`${operators.eq(fields.memberId, currentUserId)} AND ${operators.eq(
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

				// Step 5: Check if the provided category exists
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

				// Step 6: Check if the assignee user exists
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

				// Step 7: Authorization — only administrators can create action items
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

				// Step 8: Insert the new action item into the database
				const [createdActionItem] = await ctx.drizzleClient
					.insert(actionItemsTable)
					.values({
						id: uuidv7(),
						creatorId: currentUserId,
						actionItemCategoryId: parsedArgs.input.categoryId,
						assigneeId: parsedArgs.input.assigneeId,
						assignedAt: parsedArgs.input.assignedAt
							? new Date(parsedArgs.input.assignedAt)
							: new Date(), // Default to current date if not provided
						completionAt: new Date(),
						preCompletionNotes: parsedArgs.input.preCompletionNotes ?? null,
						postCompletionNotes: null,
						isCompleted: false,
						eventId: parsedArgs.input.eventId ?? null,
						organizationId: parsedArgs.input.organizationId,
						allottedHours:
							parsedArgs.input.allottedHours !== undefined
								? parsedArgs.input.allottedHours.toString()
								: "0",
						updatedAt: new Date(),
						updaterId: currentUserId,
					})
					.returning();

				// Step 9: Ensure the insert operation returned a result
				if (!createdActionItem) {
					ctx.log.error(
						"Postgres insert operation unexpectedly returned an empty array.",
					);
					throw new TalawaGraphQLError({ extensions: { code: "unexpected" } });
				}

				// Step 10: Return the newly created action item
				return createdActionItem;
			},
		}),
);
