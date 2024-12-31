import { eq } from "drizzle-orm";
import { z } from "zod";
import { agendaFoldersTable } from "~/src/drizzle/tables/agendaFolders";
import { builder } from "~/src/graphql/builder";
import {
	MutationDeleteAgendaFolderInput,
	mutationDeleteAgendaFolderInputSchema,
} from "~/src/graphql/inputs/MutationDeleteAgendaFolderInput";
import { AgendaFolder } from "~/src/graphql/types/AgendaFolder/AgendaFolder";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

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
		description: "Mutation field to delete an agenda folder.",
		resolve: async (_parent, args, ctx) => {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
					message: "Only authenticated users can perform this action.",
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
					message: "Invalid arguments provided.",
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
										organizationMembershipsWhereOrganization: {
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
					message: "Only authenticated users can perform this action.",
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
					message: "No associated resources found for the provided arguments.",
				});
			}

			const currentUserOrganizationMembership =
				existingAgendaFolder.event.organization
					.organizationMembershipsWhereOrganization[0];

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
					message:
						"You are not authorized to perform this action on the resources associated to the provided arguments.",
				});
			}

			const [deletedAgendaFolder] = await ctx.drizzleClient
				.delete(agendaFoldersTable)
				.where(eq(agendaFoldersTable.id, parsedArgs.input.id))
				.returning();

			// Deleted agenda folder not being returned means that either it was deleted or its `id` column was changed by external entities before this delete operation could take place.
			if (deletedAgendaFolder === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
					message: "Something went wrong. Please try again.",
				});
			}

			return deletedAgendaFolder;
		},
		type: AgendaFolder,
	}),
);
