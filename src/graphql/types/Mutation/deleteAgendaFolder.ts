import { eq } from "drizzle-orm";
import { z } from "zod";
import { agendaItemsTable } from "~/src/drizzle/tables/agendaItems";
import { agendaFoldersTable } from "~/src/drizzle/tables/agendaFolders";
import { builder } from "~/src/graphql/builder";
import {
	MutationDeleteAgendaFolderInput,
	mutationDeleteAgendaFolderInputSchema,
} from "~/src/graphql/inputs/MutationDeleteAgendaFolderInput";
import { AgendaFolder } from "~/src/graphql/types/AgendaFolder/AgendaFolder";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationDeleteAgendaFolderArgumentsSchema = z.object({
	input: mutationDeleteAgendaFolderInputSchema,
});

builder.mutationField("deleteAgendaFolder", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationDeleteAgendaFolderInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to delete an agenda folder.",
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
			} = mutationDeleteAgendaFolderArgumentsSchema.safeParse(args);

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
						isDefaultFolder: true,
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

			if (existingAgendaFolder.isDefaultFolder) {
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

			return await ctx.drizzleClient.transaction(async (tx) => {
				const defaultFolder = await tx.query.agendaFoldersTable.findFirst({
					columns: { id: true },
					where: (fields, operators) =>
					operators.and(
						operators.eq(fields.eventId, existingAgendaFolder.eventId),
						operators.eq(fields.isDefaultFolder, true),
					),
				});

				if (!defaultFolder) {
					throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
						message: "Default agenda folder not found.",
					},
					});
				}

				// Move all agenda items to default folder
				await tx
					.update(agendaItemsTable)
					.set({
					folderId: defaultFolder.id,
					updaterId: currentUserId,
					})
					.where(eq(agendaItemsTable.folderId, parsedArgs.input.id));

				// Delete the folder
				const [deletedAgendaFolder] = await tx
					.delete(agendaFoldersTable)
					.where(eq(agendaFoldersTable.id, parsedArgs.input.id))
					.returning();

				if (!deletedAgendaFolder) {
					throw new TalawaGraphQLError({
					extensions: { code: "unexpected" },
					});
				}

				return deletedAgendaFolder;
				});
		},
		type: AgendaFolder,
	}),
);
