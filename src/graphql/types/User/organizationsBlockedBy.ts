import { eq } from "drizzle-orm";
import { blockedUsersTable } from "~/src/drizzle/tables/blockedUsers";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { User } from "./User";
import { Organization } from "~/src/graphql/types/Organization/Organization";

User.implement({
  fields: (t) => ({
    organizationsBlockedBy: t.field({
      type: [Organization],
      resolve: async (u: User, _a, ctx) => {
        const rows = await ctx.drizzleClient
          .select({ org: organizationsTable })
          .from(organizationsTable)
          .innerJoin(
            blockedUsersTable,
            eq(blockedUsersTable.organizationId, organizationsTable.id),
          )
          .where(eq(blockedUsersTable.userId, u.id))
          .execute();

        return rows.map((r) => r.org);
      },
    }),
  }),
});
