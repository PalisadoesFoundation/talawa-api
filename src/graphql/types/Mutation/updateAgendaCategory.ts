import { eq } from "drizzle-orm";
import { z } from "zod";
import { agendaCategoriesTable } from "~/src/drizzle/tables/agendaCategories";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateAgendaCategoryInput,
	mutationUpdateAgendaCategoryInputSchema,
} from "~/src/graphql/inputs/MutationUpdateAgendaCategoryInput";
import { AgendaCategory } from "~/src/graphql/types/AgendaCategory/AgendaCategory";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationUpdateAgendaCategoryArgumentsSchema = z.object({
	input: mutationUpdateAgendaCategoryInputSchema,
});

builder.mutationField("updateAgendaCategory", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input containing the agenda category fields to update.",
				required: true,
				type: MutationUpdateAgendaCategoryInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to update an agenda category.",
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
			} = mutationUpdateAgendaCategoryArgumentsSchema.safeParse(args);

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
					columns: {
						eventId: true,
					},
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
						issues: [
							{
								argumentPath: ["input", "id"],
							},
						],
					},
				});
			}

			const currentUserOrganizationMembership =
				existingAgendaCategory.event.organization
					.membershipsWhereOrganization[0];

			if (
				currentUser.role !== "administrator" &&
				(currentUserOrganizationMembership === undefined ||
					currentUserOrganizationMembership.role !== "administrator")
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

			const updateData: Partial<typeof agendaCategoriesTable.$inferInsert> = {
				updaterId: currentUserId,
			};

			if (parsedArgs.input.name !== undefined) {
				updateData.name = parsedArgs.input.name;
			}

			if (parsedArgs.input.description !== undefined) {
				updateData.description = parsedArgs.input.description;
			}

			const [updatedAgendaCategory] = await ctx.drizzleClient
				.update(agendaCategoriesTable)
				.set(updateData)
				.where(eq(agendaCategoriesTable.id, parsedArgs.input.id))
				.returning();

			// Updated agenda category not being returned means that either it was deleted or its `id` column was changed by external entities before this update operation could take place.
			if (updatedAgendaCategory === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return updatedAgendaCategory;
		},
		type: AgendaCategory,
	}),
);
