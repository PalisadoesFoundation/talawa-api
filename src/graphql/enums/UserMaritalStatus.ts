import { userMaritalStatusEnum } from "~/src/drizzle/enums/userMaritalStatus";
import { builder } from "~/src/graphql/builder";

export const UserMaritalStatus = builder.enumType("UserMaritalStatus", {
	description:
		"Possible variants of the martial status(if applicable) of a user.",
	values: userMaritalStatusEnum.options,
});
