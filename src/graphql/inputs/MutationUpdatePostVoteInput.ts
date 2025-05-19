import type { z } from "zod";
import { postVotesTableInsertSchema } from "~/src/drizzle/tables/postVotes";
import { builder } from "~/src/graphql/builder";
import { PostVoteType } from "~/src/graphql/enums/PostVoteType";

export const mutationUpdatePostVoteInputSchema =
	postVotesTableInsertSchema.pick({
		postId: true,
		type: true,
	});

export const MutationUpdatePostVoteInput = builder
	.inputRef<z.infer<typeof mutationUpdatePostVoteInputSchema>>(
		"MutationUpdatePostVoteInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			postId: t.id({
				description: "Global identifier of the voted post.",
				required: true,
			}),
			type: t.field({
				description: "Type of the vote.",
				required: true,
				type: PostVoteType,
			}),
		}),
	});
