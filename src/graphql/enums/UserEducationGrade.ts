import { userEducationGradeEnum } from "~/src/drizzle/enums/userEducationGrade";
import { builder } from "~/src/graphql/builder";

export const UserEducationGrade = builder.enumType("UserEducationGrade", {
	description:
		"Possible variants of the education grade(if applicable) of a user.",
	values: userEducationGradeEnum.options,
});
