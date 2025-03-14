import type { ExplicitGraphQLContext, ImplicitMercuriusContext } from "~/src/graphql/context";
import { and, ilike, sql } from "drizzle-orm";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import { User } from "~/src/graphql/types/User/User";

type ContextType = ExplicitGraphQLContext & ImplicitMercuriusContext;

interface CreatedOrganizationsArgs {
	filter?: string | null;
}

export const resolveCreatedOrganizations = async (
	parent: User,
	args: CreatedOrganizationsArgs,
	ctx: ContextType,
): Promise<Organization[]> => {
	const { filter } = args;

	try {
		return await ctx.drizzleClient.query.organizationsTable.findMany({
			where: (fields, operators) =>
				and(
					operators.eq(fields.creatorId, parent.id),
					filter ? ilike(fields.name, `%${filter}%`) : sql`TRUE`
				),
			limit: 20,
			offset: 0,
		});
	} catch (error) {
		ctx.log.error("Error fetching created organizations:", error);
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
			resolve: resolveCreatedOrganizations,
		}),
	}),
});
