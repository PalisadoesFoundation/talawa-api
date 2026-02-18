import type { z } from "zod";
import type { userRoleEnum } from "~/src/drizzle/enums/userRole";
import type { usersTable } from "~/src/drizzle/tables/users";
import { builder } from "~/src/graphql/builder";

import { UserRole } from "~/src/graphql/enums/UserRole";

export type User = typeof usersTable.$inferSelect;

export const User = builder.objectRef<User>("User");

User.implement({
	description: "Users are the recognized identities of clients using talawa.",
	fields: (t) => ({
		avatarMimeType: t.exposeString("avatarMimeType", {
			description: "Mime type of the avatar of the user.",
		}),
		createdAt: t.expose("createdAt", {
			description: "Date time at the time the user was created.",
			type: "DateTime",
		}),
		description: t.exposeString("description", {
			description: "Custom information about the user.",
		}),
		id: t.exposeID("id", {
			description: "Global identifier of the user.",
			nullable: false,
		}),
		name: t.exposeString("name", {
			description: "Name of the user.",
		}),
		role: t.field({
			description: "Role assigned to the user in the application.",
			resolve: (user) => user.role as z.infer<typeof userRoleEnum>,
			type: UserRole,
		}),
	}),
});
