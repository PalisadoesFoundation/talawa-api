import { userMaritalStatusEnum } from "~/src/drizzle/enums/userMaritalStatus";
import { builder } from "~/src/graphql/builder";

export const UserMaritalStatus = builder.enumType("UserMaritalStatus", {
	description: "",
	values: userMaritalStatusEnum.enumValues,
});
