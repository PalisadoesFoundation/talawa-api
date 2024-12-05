import { Post } from "~/src/graphql/types/Post/Post";
import { TalawaGraphQLError } from "~/src/utilities/talawaGraphQLError";
import { Comment } from "./Comment";

Comment.implement({
	fields: (t) => ({
		post: t.field({
			description: "Post which the post belongs to.",
			resolve: async (parent, _args, ctx) => {
				const existingPost = await ctx.drizzleClient.query.postsTable.findFirst(
					{
						with: {
							postAttachmentsWherePost: true,
						},
						where: (fields, operators) =>
							operators.eq(fields.id, parent.postId),
					},
				);

				// Post id existing but the associated post not existing is a business logic error and means that the corresponding data in the database is in a corrupted state. It must be investigated and fixed as soon as possible to prevent additional data corruption.
				if (existingPost === undefined) {
					ctx.log.error(
						"Postgres select operation returned an empty array for a comment's post id that isn't null.",
					);

					throw new TalawaGraphQLError({
						extensions: {
							code: "unexpected",
						},
						message: "Something went wrong. Please try again later.",
					});
				}

				return Object.assign(existingPost, {
					attachments: existingPost.postAttachmentsWherePost,
				});
			},
			type: Post,
		}),
	}),
});
