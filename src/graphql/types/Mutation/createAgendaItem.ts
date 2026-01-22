import { z } from "zod";
import { agendaItemAttachmentsTable } from "~/src/drizzle/tables/agendaItemAttachments";
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
			const isCategoryProvidedByUser = categoryId !== undefined;
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
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["input", "eventId"],
								},
							],
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
							code: "arguments_associated_resources_not_found",
							issues: [
								{
									argumentPath: ["input", "eventId"],
								},
							],
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
								argumentPath: ["input", "folderId"],
							},
						],
					},
				});
			}

			if (existingAgendaFolder.eventId !== parsedArgs.input.eventId) {
				throw new TalawaGraphQLError({
					message: "folderId does not belong to the provided eventId.",
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "eventId"],
								message:
									"You do not have permission to perform this action on the specified event.",
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
								argumentPath: ["input", "folderId"],
							},
						],
					},
				});
			}

			const existingAgendaCategory =
				await ctx.drizzleClient.query.agendaCategoriesTable.findFirst({
					columns: { id: true },
					where: (fields, operators) =>
						operators.and(
							operators.eq(fields.id, resolvedCategoryId),
							operators.eq(fields.eventId, parsedArgs.input.eventId),
						),
				});

			if (!existingAgendaCategory) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "arguments_associated_resources_not_found",
						issues: [
							{
								argumentPath: isCategoryProvidedByUser
									? ["input", "categoryId"]
									: ["input", "eventId"],
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
						notes: parsedArgs.input.notes,
						sequence: parsedArgs.input.sequence,
						type: parsedArgs.input.type,
					})
					.returning();

				if (!createdAgendaItem) {
					ctx.log.error(
						"Postgres insert operation unexpectedly returned an empty array instead of throwing an error.",
					);

					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
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
				if (
					parsedArgs.input.attachments &&
					parsedArgs.input.attachments.length > 0 &&
					createdAttachments.length !== parsedArgs.input.attachments.length
				) {
					ctx.log.error(
						"Postgres insert operation returned fewer rows than expected for attachments.",
					);
					throw new TalawaGraphQLError({
						extensions: { code: "unexpected" },
					});
				}

				const createdUrls =
					parsedArgs.input.url && parsedArgs.input.url.length > 0
						? await tx
								.insert(agendaItemUrlTable)
								.values(
									parsedArgs.input.url.map((url) => ({
										agendaItemId: createdAgendaItem.id,
										creatorId: currentUserId,
										url: url.url,
									})),
								)
								.returning()
						: [];
				if (
					parsedArgs.input.url &&
					parsedArgs.input.url.length > 0 &&
					createdUrls.length !== parsedArgs.input.url.length
				) {
					ctx.log.error(
						"Postgres insert operation returned fewer rows than expected for URLs.",
					);
					throw new TalawaGraphQLError({
						extensions: { code: "unexpected" },
					});
				}
				return {
					...createdAgendaItem,
					url: createdUrls,
					attachments: createdAttachments,
				};
			});
		},
		type: AgendaItem,
	}),
);
