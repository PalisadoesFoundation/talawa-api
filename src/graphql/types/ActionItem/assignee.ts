import type { GraphQLContext } from "~/src/graphql/context";
import { User } from "~/src/graphql/types/User/User";
import { ActionItem } from "./actionItem";

export const resolveAssignee = async (
	parent: { assigneeId: string | null },
	_args: Record<string, never>,
	ctx: GraphQLContext,
): Promise<User | null> => {
	// Null guard
	if (!parent.assigneeId) {
		return null;
	}

	// Query the user by assigneeId using the imported usersTable type.
	const user = await ctx.drizzleClient.query.usersTable.findFirst({
		where: (fields, operators) =>
			operators.eq(fields.id, parent.assigneeId as string),
	});

	if (!user) {
		ctx.log.warn(
			`Assignee with ID ${parent.assigneeId} not found for ActionItem.`,
		);
		return null;
	}

	return user;
};

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
