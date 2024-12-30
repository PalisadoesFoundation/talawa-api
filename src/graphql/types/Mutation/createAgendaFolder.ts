import { z } from "zod";
import { agendaFoldersTable } from "~/src/drizzle/tables/agendaFolders";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateAgendaFolderInput,
	mutationCreateAgendaFolderInputSchema,
} from "~/src/graphql/inputs/MutationCreateAgendaFolderInput";
import { AgendaFolder } from "~/src/graphql/types/AgendaFolder/AgendaFolder";
import { isNotNullish } from "~/src/utilities/isNotNullish";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";

const mutationCreateAgendaFolderArgumentsSchema = z.object({
	input: mutationCreateAgendaFolderInputSchema,
});

builder.mutationField("createAgendaFolder", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationCreateAgendaFolderInput,
			}),
		},
		description: "Mutation field to create an agenda folder.",
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
			} = mutationCreateAgendaFolderArgumentsSchema.safeParse(args);

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

			const [currentUser, existingEvent] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.eventsTable.findFirst({
					columns: {},
					with: {
						organization: {
							columns: {},
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
					where: (fields, operators) =>
						operators.eq(fields.id, parsedArgs.input.eventId),
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

			if (existingEvent === undefined) {
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

			if (isNotNullish(parsedArgs.input.parentFolderId)) {
				const parentFolderId = parsedArgs.input.parentFolderId;

				const existingParentFolder =
					await ctx.drizzleClient.query.agendaFoldersTable.findFirst({
						where: (fields, operators) =>
							operators.eq(fields.id, parentFolderId),
					});

				if (existingParentFolder === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["input", "folderId"],
								},
							],
						},
						message:
							"No associated resources found for the provided arguments.",
					});
				}

				if (existingParentFolder.eventId !== parsedArgs.input.eventId) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "forbidden_action_on_arguments_associated_resources",
							issues: [
								{
									argumentPath: ["input", "folderId"],
									message:
										"This agenda folder must be associated to the provided event.",
								},
								{
									argumentPath: ["input", "eventId"],
									message:
										"This event must be associated to the provided parent agenda folder.",
								},
							],
						},
						message:
							"This action is forbidden on the resources associated to the provided arguments.",
					});
				}

				if (existingParentFolder.isAgendaItemFolder) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "forbidden_action_on_arguments_associated_resources",
							issues: [
								{
									argumentPath: ["input", "folderId"],
									message:
										"This agenda folder cannot be a parent to agenda folders.",
								},
							],
						},
						message:
							"This action is forbidden on the resources associated to the provided arguments.",
					});
				}
			}

			const currentUserOrganizationMembership =
				existingEvent.organization.organizationMembershipsWhereOrganization[0];

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

			const [createdAgendaFolder] = await ctx.drizzleClient
				.insert(agendaFoldersTable)
				.values({
					creatorId: currentUserId,
					eventId: parsedArgs.input.eventId,
					isAgendaItemFolder: parsedArgs.input.isAgendaItemFolder,
					name: parsedArgs.input.name,
					parentFolderId: parsedArgs.input.parentFolderId,
				})
				.returning();

			// Inserted agenda folder not being returned is an external defect unrelated to this code. It is very unlikely for this error to occur.
			if (createdAgendaFolder === undefined) {
				ctx.log.error(
					"Postgres insert operation unexpectedly returned an empty array instead of throwing an error.",
				);

				throw new TalawaGraphQLError({
					extensions: {
						code: "unexpected",
					},
					message: "Something went wrong. Please try again.",
				});
			}

			return createdAgendaFolder;
		},
		type: AgendaFolder,
	}),
);
