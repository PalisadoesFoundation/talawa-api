import type { DrizzleClient } from "~/src/plugins/drizzleClient";
import { TalawaGraphQLError } from "./TalawaGraphQLError";

export async function validateAgendaFolder(
	drizzleClient: DrizzleClient,
	folderId: string,
	eventId: string,
) {
	const existingAgendaFolder =
		await drizzleClient.query.agendaFoldersTable.findFirst({
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

	if (existingAgendaFolder.eventId !== eventId) {
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
						message: "This agenda folder cannot be a folder to agenda items.",
					},
				],
			},
		});
	}
}