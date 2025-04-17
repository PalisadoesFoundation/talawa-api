import type { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";
import { User } from "~/src/graphql/types/User/User";

export type UsersConnectionType = { user: typeof usersTable.$inferSelect };

export const UsersConnection =
	builder.objectRef<UsersConnectionType>("UsersConnection");

UsersConnection.implement({
	fields: (t) => ({
		user: t.field({
			type: User,
			resolve: (p) => p.user,
		}),
	}),
});
