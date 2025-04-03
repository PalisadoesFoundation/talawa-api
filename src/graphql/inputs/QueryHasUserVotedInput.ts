import type { z } from "zod";
import { postVotesTableInsertSchema } from "~/src/drizzle/tables/postVotes";
import { builder } from "~/src/graphql/builder";

export const queryHasUserVotedInputSchema = postVotesTableInsertSchema.pick({
	postId: true,
});

export const QueryHasUserVotedInput = builder
	.inputRef<z.infer<typeof queryHasUserVotedInputSchema>>(
		"QueryHasUserVotedInput",
	)
	.implement({
		description:
			"Input type for checking if a user has voted on a specific post",
		fields: (t) => ({
			postId: t.string({
				description: "ID of the post that is voted.",
				required: true,
			}),
		}),
	});
