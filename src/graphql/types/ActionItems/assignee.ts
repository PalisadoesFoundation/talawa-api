import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { ActionItem } from "./ActionItem";

ActionItem.implement({
	fields: (t) => ({
		assignee: t.field({
			type: User,
			nullable: true,
			description: "The user assigned to this action item.",
			resolve: async (parent, _args, ctx) => {
				// Null guard
				if (!parent.assigneeId) {
					return null;
				}

				// Query the user by assigneeId
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
							code: "arguments_associated_resources_not_found", // Reverted to recognized error code
							issues: [
								{
									argumentPath: ["assigneeId"],
								},
							],
						},
					});
				}

				return user;
			},
		}),
	}),
});
