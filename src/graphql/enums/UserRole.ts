import { userRoleEnum } from "~/src/drizzle/enums/userRole";
import { builder } from "~/src/graphql/builder";

export const UserRole = builder.enumType("UserRole", {
	description: "Possible variants of the role assigned to a user.",
	values: userRoleEnum.options,
});
