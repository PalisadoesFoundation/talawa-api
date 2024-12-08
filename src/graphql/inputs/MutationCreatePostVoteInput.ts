import type { z } from "zod";
import { postVotesTableInsertSchema } from "~/src/drizzle/tables/postVotes";
import { builder } from "~/src/graphql/builder";
import { PostVoteType } from "~/src/graphql/enums/PostVoteType";

export const mutationCreatePostVoteInputSchema =
	postVotesTableInsertSchema.pick({
		postId: true,
		type: true,
	});

export const MutationCreatePostVoteInput = builder
	.inputRef<z.infer<typeof mutationCreatePostVoteInputSchema>>(
		"MutationCreatePostVoteInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			postId: t.id({
				description: "Global identifier of the post that is voted.",
				required: true,
			}),
			type: t.field({
				description: "Type of the vote.",
				required: true,
				type: PostVoteType,
			}),
		}),
	});
