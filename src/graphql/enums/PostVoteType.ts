import { postVoteTypeEnum } from "~/src/drizzle/enums/postVoteType";
import { builder } from "~/src/graphql/builder";

export const PostVoteType = builder.enumType("PostVoteType", {
	description: "Possible variants of the type of a vote on a post.",
	values: postVoteTypeEnum.options,
});
