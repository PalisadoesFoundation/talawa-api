import type { z } from "zod";
import { postVotesTableInsertSchema } from "~/src/drizzle/tables/postVotes";
import { builder } from "~/src/graphql/builder";

export const queryHasUserVoteInputSchema = postVotesTableInsertSchema.pick({
	postId: true,
});

export const QueryHasUserVotedInput = builder
	.inputRef<z.infer<typeof queryHasUserVoteInputSchema>>("QueryHasUserVotedInput")
	.implement({
		description: "",
		fields: (t) => ({
			postId: t.string({
				description: "ID of the post that is voted.",
				required: true,
			}),
		}),
	});
