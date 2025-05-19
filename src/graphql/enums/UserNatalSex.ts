import { userNatalSexEnum } from "~/src/drizzle/enums/userNatalSex";
import { builder } from "~/src/graphql/builder";

export const UserNatalSex = builder.enumType("UserNatalSex", {
	description: "Possible variants of the sex assigned to a user at birth.",
	values: userNatalSexEnum.options,
});
