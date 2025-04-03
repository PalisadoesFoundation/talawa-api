import type { z } from "zod";
import type { postVoteTypeEnum } from "~/src/drizzle/enums/postVoteType";
import { builder } from "~/src/graphql/builder";
import { PostVoteType } from "../../enums/PostVoteType";
export const HasUserVoted = builder.objectRef<{
	type: z.infer<typeof postVoteTypeEnum>;
}>("hasUserVoted");

HasUserVoted.implement({
	fields: (t) => ({
		type: t.expose("type", {
			type: PostVoteType,
			nullable: false,
			description: "Type of the post vote",
		}),
	}),
});
