import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { ActionItem } from "~/src/graphql/types/ActionItem/ActionItem";
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
				const [currentUser, organization] = await Promise.all([
					ctx.drizzleClient.query.usersTable.findFirst({
						columns: {
							role: true,
						},
						where: (fields, operators) =>
							operators.eq(fields.id, currentUserId),
					}),
					ctx.drizzleClient.query.organizationsTable.findFirst({
						columns: {
							id: true,
						},
						where: (fields, operators) =>
							operators.eq(fields.id, parsedArgs.input.organizationId),
						with: {
							membershipsWhereOrganization: {
								columns: {
									role: true,
								},
								where: (fields, operators) =>
									operators.eq(fields.memberId, currentUserId),
							},
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

				if (organization === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [{ argumentPath: ["input", "organizationId"] }],
						},
					});
				}

				const currentUserOrganizationMembership =
					organization.membershipsWhereOrganization[0];

				if (
					currentUser.role !== "administrator" &&
					!currentUserOrganizationMembership
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: [{ argumentPath: ["input", "organizationId"] }],
						},
					});
				}

				const actionItems = await ctx.drizzleClient.query.actionsTable.findMany(
					{
						where: (fields, operators) =>
							operators.eq(
								fields.organizationId,
								parsedArgs.input.organizationId,
							),
					},
				);

				return actionItems;
			},
			type: [ActionItem], // Returns an array of ActionItems
		}),
);
