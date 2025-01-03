import { userEmploymentStatusEnum } from "~/src/drizzle/enums/userEmploymentStatus";
import { builder } from "~/src/graphql/builder";

export const UserEmploymentStatus = builder.enumType("UserEmploymentStatus", {
	description:
		"Possible variants of the employment status(if applicable) of a user.",
	values: userEmploymentStatusEnum.options,
});
