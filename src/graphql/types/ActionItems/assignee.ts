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
				if (!parent.assigneeId) {
					return null;
				}
				const user = await ctx.drizzleClient.query.usersTable.findFirst({
					where: (fields, operators) =>
						operators.eq(fields.id, parent.assigneeId as string),
				});

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
			},
		}),
	}),
});
