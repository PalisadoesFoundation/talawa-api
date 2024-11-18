import { userEmploymentStatusEnum } from "~/src/drizzle/enums/userEmploymentStatus";
import { builder } from "~/src/graphql/builder";

export const UserEmploymentStatus = builder.enumType("UserEmploymentStatus", {
	description: "",
	values: userEmploymentStatusEnum.enumValues,
});
