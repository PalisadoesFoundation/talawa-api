import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Possible variants of the sex assigned to a user at birth.
 */
export const userNatalSexEnum = pgEnum("user_natal_sex", [
	"female",
	"intersex",
	"male",
]);
