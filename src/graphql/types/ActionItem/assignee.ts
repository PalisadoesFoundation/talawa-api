// Import the request-scoped GraphQL context type
import type { GraphQLContext } from "~/src/graphql/context";

// Import the User GraphQL type for return value of the resolver
import { User } from "~/src/graphql/types/User/User";

// Import the ActionItem type to extend with the `assignee` field
import { ActionItem } from "./actionItem";

/**
 * 🔹 Resolver: resolveAssignee
 * - Resolves the `assignee` field for an ActionItem.
 * - Fetches the User from the database using `assigneeId`.
 */
export const resolveAssignee = async (
	parent: { assigneeId: string | null },
	_args: Record<string, never>,
	ctx: GraphQLContext,
): Promise<User | null> => {
	// Return null if the assignee ID is missing
	if (!parent.assigneeId) {
		return null;
	}

	// Query the user by ID from the users table
	const user = await ctx.drizzleClient.query.usersTable.findFirst({
		where: (fields, operators) =>
			operators.eq(fields.id, parent.assigneeId as string),
	});

	// Log a warning and return null if the user doesn't exist
	if (!user) {
		ctx.log.warn(
			`Assignee with ID ${parent.assigneeId} not found for ActionItem.`,
		);
		return null;
	}

	// Return the resolved user
	return user;
};

/**
 * 🔹 Extend the ActionItem GraphQL type with the `assignee` field.
 * - Nullable: returns null if no user is assigned or the user is missing.
 * - Uses the `resolveAssignee` function to fetch data.
 */
ActionItem.implement({
	fields: (t) => ({
		assignee: t.field({
			type: User,
			nullable: true,
			description: "The user assigned to this action item.",
			resolve: resolveAssignee,
		}),
	}),
});
