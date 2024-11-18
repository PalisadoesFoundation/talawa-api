import { userEducationGradeEnum } from "~/src/drizzle/enums/userEducationGrade";
import { builder } from "~/src/graphql/builder";

export const UserEducationGrade = builder.enumType("UserEducationGrade", {
	description: "",
	values: userEducationGradeEnum.enumValues,
});
