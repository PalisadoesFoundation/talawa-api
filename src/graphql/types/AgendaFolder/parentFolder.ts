import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { AgendaFolder } from "./AgendaFolder";

AgendaFolder.implement({
	fields: (t) => ({
		parentFolder: t.field({
			description:
				"Agenda folder that is a parent folder to the agenda folder.",
			resolve: async (parent, _args, ctx) => {
				if (parent.parentFolderId === null) {
					return null;
				}

				const parentFolderId = parent.parentFolderId;

				const existingAgendaFolder =
					await ctx.drizzleClient.query.agendaFoldersTable.findFirst({
						where: (fields, operators) =>
							operators.eq(fields.id, parentFolderId),
					});

				// Parent folder id existing but the associated agenda folder not existing is a business logic error and probably means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
				if (existingAgendaFolder === undefined) {
					ctx.log.error(
						"Postgres select operation returned an empty array for an agenda folder's parent folder id that isn't null.",
					);

					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				return existingAgendaFolder;
			},
			type: AgendaFolder,
		}),
	}),
});
