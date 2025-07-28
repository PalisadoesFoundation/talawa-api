import { eq, inArray } from "drizzle-orm";
import { agendaFoldersTable } from "~/src/drizzle/tables/agendaFolders";
import { agendaItemsTable } from "~/src/drizzle/tables/agendaItems";
import type { GraphQLContext } from "~/src/graphql/context";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import type { Event } from "./Event";

export const resolveAgendaItems = async (
	parent: Event,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	// Authorization Logic
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}
	const currentUserId = ctx.currentClient.user.id;
	const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
		columns: {
			role: true,
		},
		with: {
			organizationMembershipsWhereMember: {
				columns: {
					role: true,
				},
				where: (fields, operators) =>
					operators.eq(fields.organizationId, parent.organizationId),
			},
		},
		where: (fields, operators) => operators.eq(fields.id, currentUserId),
	});

	if (currentUser === undefined) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const currentUserOrganizationMembership =
		currentUser.organizationMembershipsWhereMember[0];

	if (
		currentUser.role !== "administrator" &&
		(currentUserOrganizationMembership === undefined ||
			(currentUserOrganizationMembership.role !== "administrator" &&
				currentUserOrganizationMembership.role !== "regular"))
	) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthorized_action",
			},
		});
	}

	// Core Logic to Fetch All Items
	const folders = await ctx.drizzleClient.query.agendaFoldersTable.findMany({
		where: eq(agendaFoldersTable.eventId, parent.id),
		columns: {
			id: true,
		},
	});

	if (folders.length === 0) {
		return [];
	}

	const folderIds = folders.map((f) => f.id);

	const items = await ctx.drizzleClient.query.agendaItemsTable.findMany({
		where: inArray(agendaItemsTable.folderId, folderIds),
	});

	return items;
};
