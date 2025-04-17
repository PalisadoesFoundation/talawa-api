import { and, eq, ilike, inArray, not, sql } from "drizzle-orm";
import { z } from "zod";

import { builder } from "~/src/graphql/builder";

import {
	UsersWhereInput,
	usersWhereInputSchema,
} from "~/src/graphql/inputs/UsersWhereInput";
import { UsersConnection } from "~/src/graphql/types/UsersConnection";

import type { GraphQLContext } from "~/src/graphql/context";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import envConfig from "~/src/utilities/graphqLimits";

const argsSchema = z.object({
	where: usersWhereInputSchema.optional(),
});

builder.queryField("users", (t) =>
	t.field({
		type: [UsersConnection],
		description:
			"Returns every user the signed‑in client can pick for a new direct chat " +
			"(i.e. all accounts except their own). " +
			"Optional filters: id_not_in, firstName_contains, lastName_contains.",
		complexity: envConfig.API_GRAPHQL_NON_PAGINATED_LIST_FIELD_COST,
		args: {
			where: t.arg({ type: UsersWhereInput, required: false }),
		},

		async resolve(_parent, args, ctx: GraphQLContext) {
			if (!ctx.currentClient.isAuthenticated) {
				throw new TalawaGraphQLError({
					extensions: { code: "unauthenticated" },
				});
			}

			const parsed = argsSchema.safeParse(args);
			if (!parsed.success) {
				throw new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: parsed.error.issues.map((i) => ({
							argumentPath: i.path,
							message: i.message,
						})),
					},
				});
			}

			const { id_not_in, firstName_contains, lastName_contains } =
				parsed.data.where ?? {};
			const myUserId = ctx.currentClient.user.id;

			const rows = await ctx.drizzleClient.query.usersTable.findMany({
				where: (u, op) =>
					and(
						not(eq(u.id, myUserId)),

						id_not_in?.length ? not(inArray(u.id, id_not_in)) : sql`TRUE`,

						firstName_contains
							? ilike(u.name, `%${firstName_contains}%`)
							: sql`TRUE`,
						lastName_contains
							? ilike(u.name, `%${lastName_contains}%`)
							: sql`TRUE`,
					),
			});

			return rows.map((user) => ({ user }));
		},
	}),
);
