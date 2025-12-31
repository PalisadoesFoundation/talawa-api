import type { GraphQLContext } from "~/src/graphql/context";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";
import { AgendaFolder } from "./AgendaFolder";
import type { AgendaFolder as AgendaFolderType } from "./AgendaFolder";

// Export the resolver function so it can be tested
export const resolveOrganization = async (
	parent: AgendaFolderType,
	_args: Record<string, never>,
	ctx: GraphQLContext,
) => {
	const existingOrganization =
		await ctx.drizzleClient.query.organizationsTable.findFirst({
			where: (fields, operators) =>
				operators.eq(fields.id, parent.organizationId!),
		});

	if (existingOrganization === undefined) {
		ctx.log.error(
			"Postgres select operation returned an empty array for an agenda item category's organization id that isn't null.",
		);

		throw new TalawaGraphQLError({
			extensions: {
				code: "unexpected",
			},
		});
	}

	return existingOrganization;
};

AgendaFolder.implement({
	fields: (t) => ({
		organization: t.field({
			description: "Organization which the agenda item category belongs to.",
			type: Organization,
			complexity: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
			resolve: resolveOrganization, // Use the exported function
		}),
	}),
});
