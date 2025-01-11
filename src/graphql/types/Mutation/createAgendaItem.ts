import { z } from "zod";
import { agendaItemsTable } from "~/src/drizzle/tables/agendaItems";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateAgendaItemInput,
	mutationCreateAgendaItemInputSchema,
} from "~/src/graphql/inputs/MutationCreateAgendaItemInput";
import { AgendaItem } from "~/src/graphql/types/AgendaItem/AgendaItem";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationCreateAgendaItemArgumentsSchema = z.object({
	input: mutationCreateAgendaItemInputSchema,
});

builder.mutationField("createAgendaItem", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationCreateAgendaItemInput,
			}),
		},
		description: "Mutation field to create an agenda item.",
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
			} = mutationCreateAgendaItemArgumentsSchema.safeParse(args);

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

			const [currentUser, existingAgendaFolder] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.agendaFoldersTable.findFirst({
					columns: {
						isAgendaItemFolder: true,
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
						operators.eq(fields.id, parsedArgs.input.folderId),
				}),
			]);

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			if (existingAgendaFolder === undefined) {
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

			if (!existingAgendaFolder.isAgendaItemFolder) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "folderId"],
								message:
									"This agenda folder cannot be a folder to agenda items.",
							},
						],
					},
				});
			}

			const currentUserOrganizationMembership =
				existingAgendaFolder.event.organization.membershipsWhereOrganization[0];

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

			const [createdAgendaItem] = await ctx.drizzleClient
				.insert(agendaItemsTable)
				.values({
					creatorId: currentUserId,
					description: parsedArgs.input.description,
					duration: parsedArgs.input.duration,
					folderId: parsedArgs.input.folderId,
					key: parsedArgs.input.key,
					name: parsedArgs.input.name,
					type: parsedArgs.input.type,
				})
				.returning();

			// Inserted agenda item not being returned is an external defect unrelated to this code. It is very unlikely for this error to occur.
			if (createdAgendaItem === undefined) {
				ctx.log.error(
					"Postgres insert operation unexpectedly returned an empty array instead of throwing an error.",
				);

				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return createdAgendaItem;
		},
		type: AgendaItem,
	}),
);
