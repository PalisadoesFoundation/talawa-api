import { and, ilike, sql } from "drizzle-orm";
import type {
	ExplicitGraphQLContext,
	ImplicitMercuriusContext,
} from "~/src/graphql/context";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import { User } from "~/src/graphql/types/User/User";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

type ContextType = ExplicitGraphQLContext & ImplicitMercuriusContext;

interface CreatedOrganizationsArgs {
	filter?: string | null;
}

export const resolveCreatedOrganizations = async (
	parent: User,
	args: CreatedOrganizationsArgs,
	ctx: ContextType,
): Promise<Organization[]> => {
	if (!ctx.currentClient.isAuthenticated) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "unauthenticated",
			},
		});
	}

	const { filter } = args;

	try {
		return await ctx.drizzleClient.query.organizationsTable.findMany({
			where: (fields, operators) =>
				and(
					operators.eq(fields.creatorId, parent.id),
					filter ? ilike(fields.name, `%${filter}%`) : sql`TRUE`,
				),
			limit: 20,
			offset: 0,
		});
	} catch (error) {
		ctx.log.error(error, "Error fetching created organizations");
		throw new Error("Failed to retrieve organizations created by the user");
	}
};

User.implement({
	fields: (t) => ({
		createdOrganizations: t.field({
			type: [Organization],
			description: "Organizations created by the user",
			args: {
				filter: t.arg.string({ required: false }),
			},
			complexity: envConfig.API_GRAPHQL_NON_PAGINATED_LIST_FIELD_COST,
			resolve: resolveCreatedOrganizations,
		}),
	}),
});
