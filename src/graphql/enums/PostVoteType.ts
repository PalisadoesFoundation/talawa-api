import { postVoteTypeEnum } from "~/src/drizzle/enums/postVoteType";
import { builder } from "~/src/graphql/builder";

export const PostVoteType = builder.enumType("PostVoteType", {
	description: "",
	values: postVoteTypeEnum.enumValues,
});
