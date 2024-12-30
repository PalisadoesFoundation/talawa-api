import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";
import { AgendaFolder } from "./AgendaFolder";

AgendaFolder.implement({
	fields: (t) => ({
		parentFolder: t.field({
			description:
				"Agenda folder that is a parent folder to the agenda folder.",
			resolve: async (parent, _args, ctx) => {
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
						message: "Only authenticated users can perform this action.",
					});
				}

				const currentUserId = ctx.currentClient.user.id;

				const [currentUser, existingEvent] = await Promise.all([
					ctx.drizzleClient.query.usersTable.findFirst({
						columns: {
							role: true,
						},
						where: (fields, operators) =>
							operators.eq(fields.id, currentUserId),
					}),
					ctx.drizzleClient.query.eventsTable.findFirst({
						columns: {},
						where: (fields, operators) =>
							operators.eq(fields.id, parent.eventId),
						with: {
							organization: {
								columns: {},
								with: {
									organizationMembershipsWhereOrganization: {
										columns: {
											role: true,
										},
										where: (fields, operators) =>
											operators.eq(fields.memberId, currentUserId),
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
						message: "Only authenticated users can perform this action.",
					});
				}

				// Event id existing but the associated event not existing is a business logic error and means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
				if (existingEvent === undefined) {
					ctx.log.error(
						"Postgres select operation returned an empty array for an agenda folder's event id that isn't null.",
					);

					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
						message: "Something went wrong. Please try again later.",
					});
				}

				const currentUserOrganizationMembership =
					existingEvent.organization
						.organizationMembershipsWhereOrganization[0];

				if (
					currentUser.role !== "administrator" &&
					(currentUserOrganizationMembership === undefined ||
						currentUserOrganizationMembership.role !== "administrator")
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action",
						},
						message: "You are not authorized to perform this action.",
					});
				}

				if (parent.parentFolderId === null) {
					return null;
				}

				const parentFolderId = parent.parentFolderId;

				const existingAgendaFolder =
					await ctx.drizzleClient.query.agendaFoldersTable.findFirst({
						where: (fields, operators) =>
							operators.eq(fields.id, parentFolderId),
					});

				// Parent folder id existing but the associated agenda folder not existing is a business logic error and means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
				if (existingAgendaFolder === undefined) {
					ctx.log.error(
						"Postgres select operation returned an empty array for an agenda folder's parent folder id that isn't null.",
					);

					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
						message: "Something went wrong. Please try again later.",
					});
				}

				return existingAgendaFolder;
			},
			type: AgendaFolder,
		}),
	}),
});
