import { eq } from "drizzle-orm";
import { organizationMembershipsTable } from "~/src/drizzle/tables/organizationMemberships";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { Organization } from "~/src/graphql/types/Organization/Organization";
import { User } from "./User";

User.implement({
	fields: (t) => ({
		joinedOrganizations: t.field({
			type: [Organization],
			resolve: async (u: User, _a, ctx) => {
				const rows = await ctx.drizzleClient
					.select({ org: organizationsTable })
					.from(organizationsTable)
					.innerJoin(
						organizationMembershipsTable,
						eq(
							organizationMembershipsTable.organizationId,
							organizationsTable.id,
						),
					)
					.where(eq(organizationMembershipsTable.memberId, u.id))
					.execute();

				return rows.map((r) => r.org);
			},
		}),
	}),
});
