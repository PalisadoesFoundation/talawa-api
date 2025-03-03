import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { ActionItem } from "~/src/graphql/types/ActionItems/ActionItem";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import {
	QueryActionItemsByOrganizationInput,
	queryActionItemsByOrgInputSchema,
} from "../../inputs/QueryActionItemInput";

const queryActionItemsByOrganizationArgumentsSchema = z.object({
	input: queryActionItemsByOrgInputSchema,
});

/**
 * GraphQL Query: Fetches all ActionItems by organizationId.
 */
export const actionItemsByOrganization = builder.queryField(
	"actionItemsByOrganization",
	(t) =>
		t.field({
			args: {
				input: t.arg({
					description:
						"Input parameters to fetch action items by organizationId.",
					required: true,
					type: QueryActionItemsByOrganizationInput,
				}),
			},
			description:
				"Query field to fetch all action items linked to a specific organization.",
			resolve: async (_parent, args, ctx) => {
				// Check if the user is authenticated
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				// Validate query arguments
				const {
					data: parsedArgs,
					error,
					success,
				} = queryActionItemsByOrganizationArgumentsSchema.safeParse(args);

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

				// Fetch the current user and action items by organizationId
				const [currentUser, actionItems] = await Promise.all([
					ctx.drizzleClient.query.usersTable.findFirst({
						columns: {
							role: true,
						},
						where: (fields, operators) =>
							operators.eq(fields.id, currentUserId),
					}),
					ctx.drizzleClient.query.actionsTable.findMany({
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
							if (!parsedArgs.input.organizationId) {
								throw new TalawaGraphQLError({
									message: "Organization ID is required but was not provided.",
									extensions: {
										code: "invalid_arguments",
										issues: [
											{
												argumentPath: ["input", "organizationId"],
												message: "organizationId must be a non-empty string",
											},
										],
									},
								});
							}
							return operators.eq(
								fields.organizationId,
								parsedArgs.input.organizationId,
							);
						},
					}),
				]);

				// Validate if the user exists
				if (currentUser === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				// If no action items found, return an empty array
				if (!actionItems.length) {
					return [];
				}

				// Check if the user is authorized to view these action items
				const currentUserOrganizationMembership =
					actionItems.length > 0
						? actionItems[0]?.organization?.membershipsWhereOrganization?.[0]
						: undefined;

				if (!currentUserOrganizationMembership) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: [{ argumentPath: ["input", "organizationId"] }],
						},
					});
				}

				if (
					currentUser.role !== "administrator" &&
					currentUserOrganizationMembership === undefined
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: [
								{
									argumentPath: ["input", "organizationId"],
								},
							],
						},
					});
				}

				// Return all action items for the given organization
				return actionItems;
			},
			type: [ActionItem], // Returns an array of ActionItems
		}),
);
