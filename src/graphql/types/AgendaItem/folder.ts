import type { GraphQLContext } from "~/src/graphql/context";
import { AgendaFolder } from "~/src/graphql/types/AgendaFolder/AgendaFolder";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { AgendaItem as AgendaItemType } from "./AgendaItem";
import { AgendaItem } from "./AgendaItem";

// Exported resolver for unit testing
export const resolveFolder = async (
	parent: AgendaItemType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthenticated" },
		});
	}
	const currentUserId = ctx.currentClient.user.id;

	const [currentUser, existingAgendaFolder] = await Promise.all([
		ctx.drizzleClient.query.usersTable.findFirst({
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
									columns: { role: true },
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
			extensions: { code: "unauthenticated" },
		});
	}

	// Parent folder id existing but the associated agenda folder not existing
	// is a business logic error and indicates corrupted data.
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
		throw new TalawaGraphQLError({ extensions: { code: "unexpected" } });
	}

	const currentUserOrganizationMembership =
		existingAgendaFolder.event.organization.membershipsWhereOrganization[0];

	if (
		currentUser.role !== "administrator" &&
		(currentUserOrganizationMembership === undefined ||
			currentUserOrganizationMembership.role !== "administrator")
	) {
		throw new TalawaGraphQLError({
			extensions: { code: "unauthorized_action" },
		});
	}

	return existingAgendaFolder;
};

AgendaItem.implement({
	fields: (t) => ({
		folder: t.field({
			description: "Agenda folder within which the agenda item in contained.",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: resolveFolder,
			type: AgendaFolder,
		}),
	}),
});
