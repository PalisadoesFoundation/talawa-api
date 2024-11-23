import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";
import { User } from "./User";

User.implement({
	fields: (t) => ({
		updater: t.field({
			description: "User field to read the user who last updated the user.",
			resolve: async (parent, _args, ctx) => {
				if (!ctx.currentClient.isAuthenticated) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
						message: "Only authenticated users can perform this action.",
					});
				}

				const currentUserId = ctx.currentClient.user.id;
				const currentUser = await ctx.drizzleClient.query.usersTable.findFirst({
					where: (fields, operators) => operators.eq(fields.id, currentUserId),
				});

				if (currentUser === undefined) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthenticated",
						},
						message: "Only authenticated users can perform this action.",
					});
				}

				if (
					currentUser.role !== "administrator" &&
					currentUserId !== parent.id
				) {
					throw new TalawaGraphQLError({
						extensions: {
							code: "unauthorized_action",
						},
						message: "You are not authorized to perform this action.",
					});
				}

				if (parent.updaterId === null) {
					return null;
				}

				if (parent.updaterId === currentUserId) {
					return currentUser;
				}

				const updaterId = parent.updaterId;
				const updaterUser = await ctx.drizzleClient.query.usersTable.findFirst({
					where: (fields, operators) => operators.eq(fields.id, updaterId),
				});

				// Updater user id existing but the associated user not existing is a business logic error and means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
				if (updaterUser === undefined) {
					ctx.log.error(
						"Postgres select operation returned an empty array for a user's updater user id that isn't null.",
					);
					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
						message: "Something went wrong. Please try again later.",
					});
				}

				return updaterUser;
			},
			type: User,
		}),
	}),
});
