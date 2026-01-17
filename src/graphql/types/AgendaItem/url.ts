import { eq } from "drizzle-orm";
import { agendaItemUrlTable } from "~/src/drizzle/tables/agendaItemUrls";
import type { GraphQLContext } from "~/src/graphql/context";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { AgendaItemUrl } from "../AgendaItemUrl/AgendaItemUrl";
import type { AgendaItem as AgendaItemType } from "./AgendaItem";
import { AgendaItem } from "./AgendaItem";

// Exported resolver for unit testing
export const resolveUrl = async (
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

	// Folder id existing but the associated agenda folder not existing is a business logic error
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

	const currentUserOrganizationMembership =
		existingAgendaFolder.event.organization.membershipsWhereOrganization[0];

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

	const existingUrl = await ctx.drizzleClient.query.agendaItemUrlTable.findMany(
		{
			where: eq(agendaItemUrlTable.agendaItemId, parent.id),
		},
	);

	return existingUrl;
};

AgendaItem.implement({
	fields: (t) => ({
		url: t.field({
			description: "URLs associated with the agenda item",
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: resolveUrl,
			type: [AgendaItemUrl],
		}),
	}),
});
