import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Possible variants of the employment status(if applicable) of a user.
 */
export const userEmploymentStatusEnum = pgEnum("user_employment_status", [
	"full_time",
	"part_time",
	"unemployed",
]);
