import type { z } from "zod";
import { postVotesTableInsertSchema } from "~/src/drizzle/tables/postVotes";
import { builder } from "~/src/graphql/builder";
import { PostVoteType } from "~/src/graphql/enums/PostVoteType";

export const mutationUpdatePostVoteInputSchema = postVotesTableInsertSchema
	.pick({
		postId: true,
		type: true,
	})
	.extend({
		type: postVotesTableInsertSchema.shape.type.nullable(),
	});

export const MutationUpdatePostVoteInput = builder
	.inputRef<z.infer<typeof mutationUpdatePostVoteInputSchema>>(
		"MutationUpdatePostVoteInput",
	)
	.implement({
		description: "Input for updating or removing a vote on a post.",
		fields: (t) => ({
			postId: t.id({
				description: "Global identifier of the voted post.",
				required: true,
			}),
			type: t.field({
				description: "Type of the vote. If null, the vote will be deleted.",
				type: PostVoteType,
			}),
		}),
	});
