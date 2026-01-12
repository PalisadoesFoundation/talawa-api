import { z } from "zod";
import { agendaCategoriesTable } from "~/src/drizzle/tables/agendaCategories";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateAgendaCategoryInput,
	mutationCreateAgendaCategoryInputSchema,
} from "~/src/graphql/inputs/MutationCreateAgendaCategoryInput";
import { AgendaCategory } from "~/src/graphql/types/AgendaCategory/AgendaCategory";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationCreateAgendaCategoryArgumentsSchema = z.object({
	input: mutationCreateAgendaCategoryInputSchema,
});

builder.mutationField("createAgendaCategory", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "Input for creating a new agenda category.",
				required: true,
				type: MutationCreateAgendaCategoryInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to create an agenda category.",
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
			} = mutationCreateAgendaCategoryArgumentsSchema.safeParse(args);

			if (!success) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: error.issues.map((issue) => ({
							argumentPath: issue.path.map(String),
							message: issue.message,
						})),
					},
				});
			}

			const currentUserId = ctx.currentClient.user.id;

			const [currentUser, existingEvent] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.eventsTable.findFirst({
					with: {
						organization: {
							columns: {
								id: true,
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
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.eventId),
				}),
			]);

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			if (existingEvent === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: ["input", "eventId"],
							},
						],
					},
				});
			}

			if (existingEvent.organization === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			const currentUserOrganizationMembership =
				existingEvent.organization.membershipsWhereOrganization[0];

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
								argumentPath: ["input", "eventId"],
							},
						],
					},
				});
			}

			const [createdAgendaCategory] = await ctx.drizzleClient
				.insert(agendaCategoriesTable)
				.values({
					creatorId: currentUserId,
					eventId: parsedArgs.input.eventId,
					name: parsedArgs.input.name,
					description: parsedArgs.input.description,
					organizationId: existingEvent.organization.id,
				})
				.returning();

			// Inserted agenda category not being returned is an external defect unrelated to this code. It is very unlikely for this error to occur.
			if (createdAgendaCategory === undefined) {
				ctx.log.error(
					{
						mutation: "createAgendaCategory",
						reason: "insert_returned_empty",
					},
					"Agenda category insert unexpectedly returned no rows.",
				);

				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return createdAgendaCategory;
		},
		type: AgendaCategory,
	}),
);
