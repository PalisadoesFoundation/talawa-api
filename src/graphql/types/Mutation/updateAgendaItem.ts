import { eq } from "drizzle-orm";
import { z } from "zod";
import { agendaItemAttachmentsTable } from "~/src/drizzle/tables/agendaItemAttachments";
import { agendaItemsTable } from "~/src/drizzle/tables/agendaItems";
import { agendaItemUrlTable } from "~/src/drizzle/tables/agendaItemUrls";
import { builder } from "~/src/graphql/builder";
import {
	MutationUpdateAgendaItemInput,
	MutationUpdateAgendaItemInputSchema,
} from "~/src/graphql/inputs/MutationUpdateAgendaItemInput";
import { AgendaItem } from "~/src/graphql/types/AgendaItem/AgendaItem";
import envConfig from "~/src/utilities/graphqLimits";
import { isNotNullish } from "~/src/utilities/isNotNullish";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

const mutationUpdateAgendaItemArgumentsSchema = z.object({
	input: MutationUpdateAgendaItemInputSchema,
});

builder.mutationField("updateAgendaItem", (t) =>
	t.field({
		args: {
			input: t.arg({
				description: "",
				required: true,
				type: MutationUpdateAgendaItemInput,
			}),
		},
		complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
		description: "Mutation field to update an agenda item.",
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
			} = mutationUpdateAgendaItemArgumentsSchema.safeParse(args);

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

			const [currentUser, existingAgendaItem] = await Promise.all([
				ctx.drizzleClient.query.usersTable.findFirst({
					columns: {
						role: true,
					},
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				}),
				ctx.drizzleClient.query.agendaItemsTable.findFirst({
					columns: {
						type: true,
					},
					with: {
						folder: {
							columns: {
								eventId: true,
							},
							with: {
								event: {
									columns: {},
									with: {
										organization: {
											columns: {},
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
						},
					},
					where: (fields, { eq }) => eq(fields.id, parsedArgs.input.id),
				}),
			]);

			if (currentUser === undefined) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				});
			}

			if (existingAgendaItem === undefined) {
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
			function validateAgendaItemTypeConstraints(
				type: string,
				input: {
					duration?: string | null | undefined;
					key?: string | null | undefined;
				},
			) {
				const issues: Array<{ argumentPath: string[]; message: string }> = [];

				if (type === "note") {
					if (input.duration !== undefined) {
						issues.push({
							argumentPath: ["input", "duration"],
							message: `Cannot be provided for an agenda item of type "${type}"`,
						});
					}
					if (input.key !== undefined) {
						issues.push({
							argumentPath: ["input", "key"],
							message: `Cannot be provided for an agenda item of type "${type}"`,
						});
					}
				}

				if (
					(type === "general" || type === "scripture") &&
					input.key !== undefined
				) {
					issues.push({
						argumentPath: ["input", "key"],
						message: `Cannot be provided for an agenda item of type "${type}"`,
					});
				}

				return issues;
			}
			const validationIssues = validateAgendaItemTypeConstraints(
				existingAgendaItem.type,
				parsedArgs.input,
			);

			if (validationIssues.length > 0) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: validationIssues,
					},
				});
			}

			if (isNotNullish(parsedArgs.input.folderId)) {
				const folderId = parsedArgs.input.folderId;

				const existingAgendaFolder =
					await ctx.drizzleClient.query.agendaFoldersTable.findFirst({
						columns: {
							eventId: true,
						},
						where: (fields, operators) => operators.eq(fields.id, folderId),
					});

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

				if (
					existingAgendaFolder.eventId !== existingAgendaItem.folder.eventId
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "forbidden_action_on_arguments_associated_resources",
							issues: [
								{
									argumentPath: ["input", "folderId"],
									message:
										"This agenda folder does not belong to the event to the agenda item.",
								},
							],
						},
					});
				}
			}

			const currentUserOrganizationMembership =
				existingAgendaItem.folder.event.organization
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

			// Use transaction to atomically update agenda item and replace attachments
			return await ctx.drizzleClient.transaction(async (tx) => {
				// Build explicit partial update object to protect NOT NULL columns
				const updates: Partial<typeof agendaItemsTable.$inferInsert> = {
					updaterId: currentUserId,
				};

				if (parsedArgs.input.description !== undefined) {
					updates.description = parsedArgs.input.description;
				}
				if (parsedArgs.input.duration !== undefined) {
					updates.duration = parsedArgs.input.duration;
				}
				if (parsedArgs.input.categoryId !== undefined) {
					updates.categoryId = parsedArgs.input.categoryId;
				}
				if (parsedArgs.input.folderId !== undefined) {
					updates.folderId = parsedArgs.input.folderId;
				}
				if (parsedArgs.input.key !== undefined) {
					updates.key = parsedArgs.input.key;
				}
				if (parsedArgs.input.name !== undefined) {
					updates.name = parsedArgs.input.name;
				}

				const [updatedAgendaItem] = await tx
					.update(agendaItemsTable)
					.set(updates)
					.where(eq(agendaItemsTable.id, parsedArgs.input.id))
					.returning();

				// Updated agenda item not being returned means it was deleted or its id changed.
				/* c8 ignore start */
				if (updatedAgendaItem === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				/* c8 ignore stop */

				// Handle attachments if provided - replace all existing with new set
				if (isNotNullish(parsedArgs.input.attachments)) {
					// Delete existing attachments
					await tx
						.delete(agendaItemAttachmentsTable)
						.where(
							eq(agendaItemAttachmentsTable.agendaItemId, parsedArgs.input.id),
						);

					// Insert new attachments if any
					if (parsedArgs.input.attachments.length > 0) {
						await tx.insert(agendaItemAttachmentsTable).values(
							parsedArgs.input.attachments.map((attachment) => ({
								agendaItemId: updatedAgendaItem.id,
								creatorId: currentUserId,
								fileHash: attachment.fileHash,
								mimeType: attachment.mimeType,
								name: attachment.name,
								objectName: attachment.objectName,
							})),
						);
					}
				}

				// Handle urls if provided - replace all existing with new set
				if (parsedArgs.input.url !== undefined) {
					// Delete existing urls
					await tx
						.delete(agendaItemUrlTable)
						.where(eq(agendaItemUrlTable.agendaItemId, parsedArgs.input.id));

					if (parsedArgs.input.url.length > 0) {
						await tx.insert(agendaItemUrlTable).values(
							parsedArgs.input.url.map((u) => ({
								agendaItemId: updatedAgendaItem.id,
								url: u.url,
								creatorId: currentUserId,
								updaterId: currentUserId,
							})),
						);
					}
				}

				return updatedAgendaItem;
			});
		},
		type: AgendaItem,
	}),
);
