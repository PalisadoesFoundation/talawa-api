import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";
import { TagFolder } from "./TagFolder";

TagFolder.implement({
	fields: (t) => ({
		parentFolder: t.field({
			description: "Parent folder of the tag folder.",
			resolve: async (parent, _args, ctx) => {
				if (parent.parentFolderId === null) {
					return null;
				}

				const parentFolderId = parent.parentFolderId;

				const existingTagFolder =
					await ctx.drizzleClient.query.tagFoldersTable.findFirst({
						where: (fields, operators) =>
							operators.eq(fields.id, parentFolderId),
					});

				// Parent folder id existing but the associated tag folder not existing is a business logic error and means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
				if (existingTagFolder === undefined) {
					ctx.log.error(
						"Postgres select operation returned an empty array for a tag folder's parent folder id that isn't null.",
					);

					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
						message: "Something went wrong. Please try again later.",
					});
				}

				return existingTagFolder;
			},
			type: TagFolder,
		}),
	}),
});
