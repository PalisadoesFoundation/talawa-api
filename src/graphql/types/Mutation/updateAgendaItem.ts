import { eq } from "drizzle-orm";
import { z } from "zod";
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
							isAgendaItemFolder: true,
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

			return await ctx.drizzleClient.transaction(async (tx) => {
				const updateData: Partial<typeof agendaItemsTable.$inferInsert> = {
					updaterId: currentUserId,
				};

				if (parsedArgs.input.name !== undefined) {
					updateData.name = parsedArgs.input.name;
				}

				if (parsedArgs.input.description !== undefined) {
					updateData.description = parsedArgs.input.description;
				}

				if (parsedArgs.input.duration !== undefined) {
					updateData.duration = parsedArgs.input.duration;
				}

				if (parsedArgs.input.folderId !== undefined) {
					updateData.folderId = parsedArgs.input.folderId;
				}

				if (parsedArgs.input.key !== undefined) {
					updateData.key = parsedArgs.input.key;
				}

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

				const [updatedAgendaItem] = await tx
					.update(agendaItemsTable)
					.set(updateData)
					.where(eq(agendaItemsTable.id, parsedArgs.input.id))
					.returning();

				if (!updatedAgendaItem) {
					throw new TalawaGraphQLError({
						extensions: { code: "unexpected" },
					});
				}

				if (parsedArgs.input.url !== undefined) {
					await tx
						.delete(agendaItemUrlTable)
						.where(eq(agendaItemUrlTable.agendaItemId, parsedArgs.input.id));

					if (parsedArgs.input.url.length > 0) {
						await tx.insert(agendaItemUrlTable).values(
							parsedArgs.input.url.map((u) => ({
								agendaItemId: parsedArgs.input.id,
								agendaItemURL: u.agendaItemURL,
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
