import { User } from "~/src/graphql/types/User/User";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { TagFolder } from "./TagFolder";

TagFolder.implement({
	fields: (t) => ({
		creator: t.field({
			description: "User who created the tag folder.",
			resolve: async (parent, _args, ctx) => {
				if (parent.creatorId === null) {
					return null;
				}

				const creatorId = parent.creatorId;

				const existingUser = await ctx.drizzleClient.query.usersTable.findFirst(
					{
						where: (fields, operators) => operators.eq(fields.id, creatorId),
					},
				);

				// Creator id existing but the associated user not existing is a business logic error and probably means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
				if (existingUser === undefined) {
					ctx.log.error(
						"Postgres select operation returned an empty array for a tag folder's creator id that isn't null.",
					);

					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
					});
				}

				return existingUser;
			},
			type: User,
		}),
	}),
});
