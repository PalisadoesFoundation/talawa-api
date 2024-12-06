import type { z } from "zod";
import { postVotesTableInsertSchema } from "~/src/drizzle/tables/postVotes";
import { builder } from "~/src/graphql/builder";

export const mutationDeletePostVoteInputSchema = postVotesTableInsertSchema
	.pick({
		postId: true,
	})
	.extend({
		creatorId: postVotesTableInsertSchema.shape.creatorId.unwrap().unwrap(),
	});

export const MutationDeletePostVoteInput = builder
	.inputRef<z.infer<typeof mutationDeletePostVoteInputSchema>>(
		"MutationDeletePostVoteInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			creatorId: t.id({
				description: "Global identifier of the user who voted.",
				required: true,
			}),
			postId: t.id({
				description: "Global identifier of the post that is voted.",
				required: true,
			}),
		}),
	});
