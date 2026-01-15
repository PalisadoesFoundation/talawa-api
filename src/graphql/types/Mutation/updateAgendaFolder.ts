import { eq } from "drizzle-orm";
import { z } from "zod";
import { agendaFoldersTable } from "~/src/drizzle/tables/agendaFolders";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateAgendaFolderInput,
	mutationUpdateAgendaFolderInputSchema,
} from "~/src/graphql/inputs/MutationUpdateAgendaFolderInput";
import { AgendaFolder } from "~/src/graphql/types/AgendaFolder/AgendaFolder";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationUpdateAgendaFolderArgumentsSchema = z.object({
	input: mutationUpdateAgendaFolderInputSchema,
});

builder.mutationField("updateAgendaFolder", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationUpdateAgendaFolderInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to update an agenda folder.",
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
			} = mutationUpdateAgendaFolderArgumentsSchema.safeParse(args);

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
						eventId: true,
						isDefaultFolder: true,
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

			const isOnlySequenceUpdate =
				parsedArgs.input.sequence !== undefined &&
				parsedArgs.input.name === undefined &&
				parsedArgs.input.description === undefined;

			// Block update for Default agenda folder
			if (existingAgendaFolder.isDefaultFolder && !isOnlySequenceUpdate) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "id"],
								message: "Default agenda folder cannot be updated.",
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

			const updateData: Partial<typeof agendaFoldersTable.$inferInsert> = {
				updaterId: currentUserId,
			};

			if (parsedArgs.input.name !== undefined) {
				updateData.name = parsedArgs.input.name;
			}

			if (parsedArgs.input.description !== undefined) {
				updateData.description = parsedArgs.input.description;
			}

			if (parsedArgs.input.sequence !== undefined) {
				updateData.sequence = parsedArgs.input.sequence;
			}

			// Defensive check: unreachable via GraphQL because the input schema
			// enforces at least one updatable field. Kept as a safety guard.
			/* istanbul ignore next */
			if (Object.keys(updateData).length === 1) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: [
							{
								argumentPath: ["input"],
								message: "At least one field must be provided to update.",
							},
						],
					},
				});
			}

			const [updatedAgendaFolder] = await ctx.drizzleClient
				.update(agendaFoldersTable)
				.set(updateData)
				.where(eq(agendaFoldersTable.id, parsedArgs.input.id))
				.returning();

			// Updated agenda folder not being returned means that either it was deleted or its `id` column was changed by external entities before this update operation could take place.
			if (updatedAgendaFolder === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
				});
			}

			return updatedAgendaFolder;
		},
		type: AgendaFolder,
	}),
);
