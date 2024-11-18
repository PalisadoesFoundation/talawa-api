import { userNatalSexEnum } from "~/src/drizzle/enums/userNatalSex";
import { builder } from "~/src/graphql/builder";

export const UserNatalSex = builder.enumType("UserNatalSex", {
	description: "",
	values: userNatalSexEnum.enumValues,
});
