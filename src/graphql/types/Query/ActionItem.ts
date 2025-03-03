import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { ActionItem } from "~/src/graphql/types/ActionItems/ActionItem";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	QueryActionItemInput,
	queryActionItemInputSchema,
} from "../../inputs/QueryActionItemInput";

const queryActionItemArgumentsSchema = z.object({
	input: queryActionItemInputSchema,
});

builder.queryField("actionItem", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input parameters to fetch an action item.",
				required: true,
				type: QueryActionItemInput,
			}),
		},
		description: "Query field to fetch a specific action item by ID.",
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
			} = queryActionItemArgumentsSchema.safeParse(args);

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

			const [currentUser, existingActionItem] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.actionsTable.findFirst({
					with: {
						assignee: true,
						category: true,
						creator: true,
						event: true,
						organization: {
							columns: {
								countryCode: true,
							},
							with: {
								membershipsWhereOrganization: {
									columns: {
										role: true,
									},
									where: (fields, operators) =>
										operators.eq(fields.memberId, currentUserId),
								},
							},
						},
					},
					where: (fields, operators) => {
						if (!parsedArgs.input.id) {
							throw new TalawaGraphQLError({
								message: "ActionItem ID is required but was not provided.",
								extensions: {
									code: "invalid_arguments",
									issues: [
										{
											argumentPath: ["input", "id"],
											message: "ID must be a non-empty string",
										},
									],
								},
							});
						}
						return operators.eq(fields.id, parsedArgs.input.id);
					},
				}),
			]);
			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			if (existingActionItem === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "id"],
							},
						],
					},
				});
			}

			const currentUserOrganizationMembership =
				existingActionItem.organization.membershipsWhereOrganization[0];

			if (
				currentUser.role !== "administrator" &&
				currentUserOrganizationMembership === undefined
			) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "id"],
							},
						],
					},
				});
			}

			return existingActionItem;
		},
		type: ActionItem,
	}),
);
