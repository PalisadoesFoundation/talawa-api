import type { z } from "zod";
import type { postVoteTypeEnum } from "~/src/drizzle/enums/postVoteType";
import { builder } from "~/src/graphql/builder";
import { PostVoteType } from "../../enums/PostVoteType";
export const hasUserVoted = builder.objectRef<{
	type: z.infer<typeof postVoteTypeEnum>;
}>("hasUserVoted");

hasUserVoted.implement({
	fields: (t) => ({
		type: t.expose("type", {
			type: PostVoteType,
			nullable: false,
			description: "Type of the post vote",
		}),
	}),
});
