import { eq } from "drizzle-orm";
import { z } from "zod";
import { agendaCategoriesTable } from "~/src/drizzle/schema";
import { builder } from "~/src/graphql/builder";
import {
	MutationDeleteAgendaCategoryInput,
	mutationDeleteAgendaCategoryInputSchema,
} from "~/src/graphql/inputs/MutationDeleteAgendaCategoryInput";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { AgendaCategory } from "../AgendaCategory/AgendaCategory";

const mutationDeleteAgendaCategoryArgumentsSchema = z.object({
	input: mutationDeleteAgendaCategoryInputSchema,
});

builder.mutationField("deleteAgendaCategory", (t) =>
	t.field({
		args: {
			input: t.arg({
				description:
					"Input containing the ID of the agenda category to delete.",
				required: true,
				type: MutationDeleteAgendaCategoryInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to delete an agenda category.",
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
			} = mutationDeleteAgendaCategoryArgumentsSchema.safeParse(args);

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

			const [currentUser, existingAgendaCategory] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.agendaCategoriesTable.findFirst({
					with: {
						event: {
							columns: {
								startAt: true,
							},
							with: {
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
						},
					},
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.id),
				}),
			]);

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			if (existingAgendaCategory === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [{ argumentPath: ["input", "id"] }],
					},
				});
			}

			const currentUserOrganizationMembership =
				existingAgendaCategory.event?.organization
					?.membershipsWhereOrganization[0];

			const isAuthorized =
				currentUser.role === "administrator" ||
				currentUserOrganizationMembership?.role === "administrator";

			if (!isAuthorized) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: [{ argumentPath: ["input", "id"] }],
					},
				});
			}

			const [deletedAgendaCategory] = await ctx.drizzleClient
				.delete(agendaCategoriesTable)
				.where(eq(agendaCategoriesTable.id, parsedArgs.input.id))
				.returning();

			// Deleted agenda category not being returned means that either it was deleted or its `id` column was changed by external entities before this delete operation could take place.
			if (deletedAgendaCategory === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return deletedAgendaCategory;
		},
		type: AgendaCategory,
	}),
);