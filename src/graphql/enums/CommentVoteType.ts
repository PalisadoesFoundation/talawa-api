import { commmentVoteTypeEnum } from "~/src/drizzle/enums/commentVoteType";
import { builder } from "~/src/graphql/builder";

export const CommentVoteType = builder.enumType("CommentVoteType", {
	description: "",
	values: commmentVoteTypeEnum.enumValues,
});
