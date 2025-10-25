import { chatTypeEnum } from "~/src/drizzle/enums/chatType";
import { builder } from "~/src/graphql/builder";

export const ChatType = builder.enumType("ChatType", {
	description:
		"Possible variants of the type of a chat.",
	values: chatTypeEnum.options,
});
