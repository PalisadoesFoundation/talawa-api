import type { GraphQLContext } from "~/src/graphql/context";
import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { ActionItem } from "./ActionItem";

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

	// If not found, log error & throw an appropriate error code from the recognized union
	if (!user) {
		ctx.log.error(
			`Assignee with ID ${parent.assigneeId} not found for ActionItem.`,
		);

		throw new TalawaGraphQLError({
			message: "Assignee not found",
			extensions: {
				code: "arguments_associated_resources_not_found",
				issues: [
					{
						argumentPath: ["assigneeId"],
					},
				],
			},
		});
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