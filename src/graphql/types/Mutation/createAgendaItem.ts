import { z } from "zod";
import { agendaItemAttachmentsTable } from "~/src/drizzle/tables/agendaItemAttachment";
import { agendaItemsTable } from "~/src/drizzle/tables/agendaItems";
import { agendaItemUrlTable } from "~/src/drizzle/tables/agendaItemUrls";
import { builder } from "~/src/graphql/builder";
import {
	MutationCreateAgendaItemInput,
	mutationCreateAgendaItemInputSchema,
} from "~/src/graphql/inputs/MutationCreateAgendaItemInput";
import { AgendaItem } from "~/src/graphql/types/AgendaItem/AgendaItem";
import envConfig from "~/src/utilities/graphqLimits";
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
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
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
			const { folderId, categoryId, eventId } = parsedArgs.input;

			let resolvedFolderId = folderId;
			let resolvedCategoryId = categoryId;

			// Resolve default folder if not provided
			if (!resolvedFolderId) {
				const defaultFolder =
					await ctx.drizzleClient.query.agendaFoldersTable.findFirst({
						columns: { id: true },
						where: (fields, operators) =>
							operators.and(
								operators.eq(fields.eventId, eventId),
								operators.eq(fields.isDefaultFolder, true),
							),
					});

				if (!defaultFolder) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
							message: "Default agenda folder not found for event",
						},
					});
				}

				resolvedFolderId = defaultFolder.id;
			}

			// Resolve default category if not provided
			if (!resolvedCategoryId) {
				const defaultCategory =
					await ctx.drizzleClient.query.agendaCategoriesTable.findFirst({
						columns: { id: true },
						where: (fields, operators) =>
							operators.and(
								operators.eq(fields.eventId, eventId),
								operators.eq(fields.isDefaultCategory, true),
							),
					});

				if (!defaultCategory) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
							message: "Default agenda category not found for event",
						},
					});
				}

				resolvedCategoryId = defaultCategory.id;
			}

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
						operators.eq(fields.id, resolvedFolderId),
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

			return await ctx.drizzleClient.transaction(async (tx) => {
				const [createdAgendaItem] = await tx
					.insert(agendaItemsTable)
					.values({
						creatorId: currentUserId,
						categoryId: resolvedCategoryId,
						description: parsedArgs.input.description,
						duration: parsedArgs.input.duration,
						eventId: parsedArgs.input.eventId,
						folderId: resolvedFolderId,
						key: parsedArgs.input.key,
						name: parsedArgs.input.name,
						sequence: parsedArgs.input.sequence,
						type: parsedArgs.input.type,
					})
					.returning();

				if (!createdAgendaItem) {
					throw new TalawaGraphQLError({
						extensions: { code: "unexpected" },
					});
				}

				const createdAttachments =
					parsedArgs.input.attachments &&
					parsedArgs.input.attachments.length > 0
						? await tx
								.insert(agendaItemAttachmentsTable)
								.values(
									parsedArgs.input.attachments.map((att) => ({
										agendaItemId: createdAgendaItem.id,
										creatorId: currentUserId,
										mimeType: att.mimeType,
										objectName: att.objectName,
										fileHash: att.fileHash,
										name: att.name,
									})),
								)
								.returning()
						: [];

				const createdUrls =
					parsedArgs.input.url && parsedArgs.input.url.length > 0
						? await tx
								.insert(agendaItemUrlTable)
								.values(
									parsedArgs.input.url.map((url) => ({
										agendaItemId: createdAgendaItem.id,
										creatorId: currentUserId,
										agendaItemURL: url.agendaItemURL,
									})),
								)
								.returning()
						: [];
				return {
					...createdAgendaItem,
					url: createdUrls,
					attachment: createdAttachments,
				};
			});
		},
		type: AgendaItem,
	}),
);
