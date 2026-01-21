import { eq } from "drizzle-orm";
import { agendaItemAttachmentsTable } from "~/src/drizzle/tables/agendaItemAttachments";
import type { GraphQLContext } from "~/src/graphql/context";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { AgendaItemAttachment } from "../AgendaItemAttachement/AgendaItemAttachment";
import { AgendaItem, type AgendaItem as AgendaItemType } from "./AgendaItem";

// Exported resolver for unit testing
export const resolveAttachments = async (
	parent: AgendaItemType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
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
			where: (fields, operators) => operators.eq(fields.id, parent.folderId),
			with: {
				event: {
					with: {
						organization: {
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
		ctx.log.error(
			"Postgres select operation returned an empty array for an agenda item's folder id that isn't null.",
		);

		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	const existingEvent = existingAgendaFolder.event;
	if (existingEvent === undefined) {
		ctx.log.error(
			"Postgres select operation returned an empty array for an agenda item's event id that isn't null.",
		);

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
				code: "unauthorized_action",
			},
		});
	}

	const existingAttachments =
		await ctx.drizzleClient.query.agendaItemAttachmentsTable.findMany({
			where: eq(agendaItemAttachmentsTable.agendaItemId, parent.id),
		});
	return existingAttachments;
};

AgendaItem.implement({
	fields: (t) => ({
		attachments: t.field({
			description: "Attachments for the agenda item",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: resolveAttachments,
			type: [AgendaItemAttachment],
		}),
	}),
});
