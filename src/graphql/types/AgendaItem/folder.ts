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
	const existingAgendaFolder =
		await ctx.drizzleClient.query.agendaFoldersTable.findFirst({
			where: (fields, operators) => operators.eq(fields.id, parent.folderId),
		});

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
