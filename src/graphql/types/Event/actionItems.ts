import { Buffer } from "node:buffer";
import { and, eq, inArray, or } from "drizzle-orm";
import type { z } from "zod";
import { actionItemExceptionsTable } from "~/src/drizzle/tables/actionItemExceptions";
import {
	actionItemsTable,
	actionItemsTableInsertSchema,
} from "~/src/drizzle/tables/actionItems";
import type { GraphQLContext } from "~/src/graphql/context";
import { ActionItem } from "~/src/graphql/types/ActionItem/ActionItem";
import envConfig from "~/src/utilities/graphqLimits";
import {
	defaultGraphQLConnectionArgumentsSchema,
	transformDefaultGraphQLConnectionArguments,
	transformToDefaultGraphQLConnection,
} from "~/src/utilities/graphqlConnection";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { Event as EventType } from "./Event";
import { Event } from "./Event";

const actionItemsArgumentsSchema = defaultGraphQLConnectionArgumentsSchema
	.transform(transformDefaultGraphQLConnectionArguments)
	.transform((arg, ctx) => {
		let cursor: z.infer<typeof cursorSchema> | undefined;

		try {
			if (arg.cursor !== undefined) {
				cursor = cursorSchema.parse(
					JSON.parse(Buffer.from(arg.cursor, "base64url").toString("utf-8")),
				);
			}
		} catch (_error) {
			ctx.addIssue({
				code: "custom",
				message: "Not a valid cursor.",
				path: [arg.isInversed ? "before" : "after"],
			});
		}

		return {
			cursor,
			isInversed: arg.isInversed,
			limit: arg.limit,
		};
	});

// Simple cursor schema using assignedAt for ordering
const cursorSchema = actionItemsTableInsertSchema
	.pick({
		assignedAt: true,
	})
	.extend({
		id: actionItemsTableInsertSchema.shape.id.unwrap(),
	});

type ActionItemsArgs = z.input<typeof defaultGraphQLConnectionArgumentsSchema>;

// Export the resolver function so it can be tested
export const resolveActionItemsPaginated = async (
	parent: EventType,
	args: ActionItemsArgs,
	ctx: GraphQLContext,
) => {
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
	} = actionItemsArgumentsSchema.safeParse(args);

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

	// Get current user with organization membership info
	const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
		columns: {
			role: true,
		},
		with: {
			organizationMembershipsWhereMember: {
				columns: {
					role: true,
				},
				where: (fields, operators) =>
					operators.eq(fields.organizationId, parent.organizationId),
			},
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

	const currentUserOrganizationMembership =
		currentUser.organizationMembershipsWhereMember[0];

	// Check if user is authorized to view action items
	// Allow if user is global admin, organization admin, or organization member
	if (
		currentUser.role !== "administrator" &&
		(currentUserOrganizationMembership === undefined ||
			(currentUserOrganizationMembership.role !== "administrator" &&
				currentUserOrganizationMembership.role !== "regular"))
	) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthorized_action",
			},
		});
	}

	const { cursor, isInversed, limit } = parsedArgs;

	const baseEventId =
		"baseRecurringEventId" in parent && parent.baseRecurringEventId
			? parent.baseRecurringEventId
			: parent.id;

	const actionItems = await ctx.drizzleClient.query.actionItemsTable.findMany({
		where: and(
			eq(actionItemsTable.organizationId, parent.organizationId),
			or(
				eq(actionItemsTable.eventId, baseEventId),
				and(eq(actionItemsTable.recurringEventInstanceId, parent.id)),
			),
		),
	});

	const actionItemIds = actionItems.map((actionItem) => actionItem.id);

	if (actionItemIds.length > 0) {
		const exceptions =
			await ctx.drizzleClient.query.actionItemExceptionsTable.findMany({
				where: and(
					inArray(actionItemExceptionsTable.actionId, actionItemIds),
					eq(actionItemExceptionsTable.eventId, parent.id),
				),
			});

		const exceptionsMap = new Map(
			exceptions.map((exception) => [exception.actionId, exception]),
		);

		// Filter out deleted items and apply exceptions
		const filteredActionItems = actionItems.filter((actionItem) => {
			const exception = exceptionsMap.get(actionItem.id);

			// If the action item is marked as deleted for this instance, exclude it
			if (exception?.deleted === true) {
				return false;
			}

			// Apply exception overrides if they exist
			if (exception) {
				actionItem.isCompleted = exception.completed ?? actionItem.isCompleted;
				actionItem.postCompletionNotes =
					exception.postCompletionNotes ?? actionItem.postCompletionNotes;
				actionItem.preCompletionNotes =
					exception.preCompletionNotes ?? actionItem.preCompletionNotes;
				// Override with instance-specific values if they exist
				if (exception.volunteerId !== null) {
					actionItem.volunteerId = exception.volunteerId;
				}
				if (exception.volunteerGroupId !== null) {
					actionItem.volunteerGroupId = exception.volunteerGroupId;
				}
				if (exception.categoryId !== null) {
					actionItem.categoryId = exception.categoryId;
				}
				if (exception.assignedAt !== null) {
					actionItem.assignedAt = exception.assignedAt;
				}
				// Mark this action item as showing instance-specific exception data
				(actionItem as { isInstanceException?: boolean }).isInstanceException =
					true;
			} else {
				(actionItem as { isInstanceException?: boolean }).isInstanceException =
					false;
			}

			return true;
		});

		// Replace the original actionItems array with the filtered one
		actionItems.length = 0;
		actionItems.push(...filteredActionItems);
	}

	// Apply pagination to the final list of action items
	const paginatedActionItems = actionItems.slice(0, limit);

	if (cursor !== undefined && paginatedActionItems.length === 0) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "arguments_associated_resources_not_found",
				issues: [
					{
						argumentPath: [isInversed ? "before" : "after"],
					},
				],
			},
		});
	}

	return transformToDefaultGraphQLConnection({
		createCursor: (actionItem) =>
			Buffer.from(
				JSON.stringify({
					id: actionItem.id,
					assignedAt: actionItem.assignedAt,
				}),
			).toString("base64url"),
		createNode: (actionItem) => actionItem,
		parsedArgs,
		rawNodes: paginatedActionItems,
	});
};

Event.implement({
	fields: (t) => ({
		actionItems: t.connection(
			{
				description:
					"GraphQL connection to traverse through the action items associated with this event.",
				resolve: resolveActionItemsPaginated,
				type: ActionItem,
				complexity: (args) => {
					return {
						field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
						multiplier: args.first || args.last || 1,
					};
				},
			},
			{
				edgesField: {
					complexity: {
						field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
						multiplier: 1,
					},
				},
				description: "",
			},
			{
				nodeField: {
					complexity: {
						field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
						multiplier: 1,
					},
				},
				description: "",
			},
		),
	}),
});
