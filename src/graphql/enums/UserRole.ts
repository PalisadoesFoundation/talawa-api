import { userRoleEnum } from "~/src/drizzle/enums/userRole";
import { builder } from "~/src/graphql/builder";

export const UserRole = builder.enumType("UserRole", {
	description: "",
	values: userRoleEnum.enumValues,
});
