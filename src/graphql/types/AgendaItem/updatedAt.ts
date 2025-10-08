import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import { AgendaItem } from "./AgendaItem";
// Type for the nested agendaFolder/event/organization/memberships structure
type Membership = { role: string };
type OrganizationWithMemberships = {
	countryCode: string | null;
	membershipsWhereOrganization: Membership[];
};
type EventWithOrganization = {
	startAt: Date;
	organization?: OrganizationWithMemberships;
};
type AgendaFolderWithEvent = {
	isAgendaItemFolder: boolean;
	event?: EventWithOrganization;
};

AgendaItem.implement({
	fields: (t) => ({
		updatedAt: t.field({
			description: "Date time at the time the agenda item was last updated.",
			complexity: envConfig.API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST,
			resolve: async (parent, _args, ctx) => {
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
						where: (fields, operators) =>
							operators.eq(fields.id, currentUserId),
					}),
					ctx.drizzleClient.query.agendaFoldersTable.findFirst({
						columns: {
							isAgendaItemFolder: true,
						},
						where: (fields, operators) =>
							operators.eq(fields.id, parent.folderId),
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
					}) as Promise<AgendaFolderWithEvent | undefined>,
				]);

				if (currentUser === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
					});
				}

				// Folder id existing but the associated agenda folder not existing is a business logic error and probably means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
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

				let currentUserOrganizationMembership: Membership | undefined =
					undefined;
				if (
					existingAgendaFolder.event?.organization &&
					Array.isArray(
						existingAgendaFolder.event.organization
							.membershipsWhereOrganization,
					)
				) {
					currentUserOrganizationMembership =
						existingAgendaFolder.event.organization
							.membershipsWhereOrganization[0];
				}

				if (
					currentUser.role !== "administrator" &&
					(!currentUserOrganizationMembership ||
						currentUserOrganizationMembership.role !== "administrator")
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action",
						},
					});
				}

				return parent.updatedAt;
			},
			type: "DateTime",
		}),
	}),
});
