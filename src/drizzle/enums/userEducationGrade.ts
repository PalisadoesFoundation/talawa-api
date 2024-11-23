import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Possible variants of education grade(if applicable) of a user.
 */
export const userEducationGradeEnum = pgEnum("user_education_grade", [
	"grade_1",
	"grade_2",
	"grade_3",
	"grade_4",
	"grade_5",
	"grade_6",
	"grade_7",
	"grade_8",
	"grade_9",
	"grade_10",
	"grade_11",
	"grade_12",
	"graduate",
	"kg",
	"no_grade",
	"pre_kg",
]);
