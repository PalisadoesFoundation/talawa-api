import type { z } from "zod";
import type { postVoteTypeEnum } from "~/src/drizzle/enums/postVoteType";
import { builder } from "~/src/graphql/builder";
import { PostVoteType } from "../../enums/PostVoteType";

export const HasUserVoted = builder.objectRef<{
	hasVoted: boolean;
	voteType: z.infer<typeof postVoteTypeEnum> | null;
}>("HasUserVoted");

HasUserVoted.implement({
	fields: (t) => ({
		hasVoted: t.field({
			type: "Boolean",
			nullable: false,
			description: "Indicates if the user has voted",
			resolve: (parent) => parent.hasVoted,
		}),
		voteType: t.expose("voteType", {
			type: PostVoteType,
			nullable: true,
			description: "Type of the post vote, null if no vote exists",
		}),
	}),
});
