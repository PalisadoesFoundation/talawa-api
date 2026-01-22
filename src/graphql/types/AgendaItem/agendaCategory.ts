import type { GraphQLContext } from "~/src/graphql/context";
import { AgendaCategory } from "~/src/graphql/types/AgendaCategory/AgendaCategory";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { AgendaItem as AgendaItemType } from "./AgendaItem";
import { AgendaItem } from "./AgendaItem";

// Exported resolver for unit testing
export const resolveCategory = async (
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

	const [currentUser, existingAgendaCategory, existingAgendaFolder] =
		await Promise.all([
			ctx.drizzleClient.query.usersTable.findFirst({
				columns: { role: true },
				where: (fields, operators) => operators.eq(fields.id, currentUserId),
			}),
			ctx.drizzleClient.query.agendaCategoriesTable.findFirst({
				where: (fields, operators) =>
					operators.eq(fields.id, parent.categoryId),
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

	if (existingAgendaCategory === undefined) {
		ctx.log.error(
			"Postgres select operation returned an empty array for an agenda category id that isn't null.",
		);

		throw new TalawaGraphQLError({
			extensions: { code: "unexpected" },
		});
	}

	if (
		existingAgendaFolder === undefined ||
		existingAgendaFolder.event === undefined ||
		existingAgendaFolder.event.organization === undefined
	) {
		ctx.log.error(
			"Postgres select operation returned an empty array for an agenda item's folder, event, or organization id that isn't null.",
		);

		throw new TalawaGraphQLError({
			extensions: { code: "unexpected" },
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
			extensions: { code: "unauthorized_action" },
		});
	}

	return existingAgendaCategory;
};

AgendaItem.implement({
	fields: (t) => ({
		category: t.field({
			description: "Agenda category",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: resolveCategory,
			type: AgendaCategory,
		}),
	}),
});
