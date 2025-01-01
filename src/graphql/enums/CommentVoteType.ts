import { commentVoteTypeEnum } from "~/src/drizzle/enums/commentVoteType";
import { builder } from "~/src/graphql/builder";

export const CommentVoteType = builder.enumType("CommentVoteType", {
	description: "Possible variants of the type of of a vote on a comment.",
	values: commentVoteTypeEnum.options,
});
