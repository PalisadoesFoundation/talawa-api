import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Possible variants of the martial status(if applicable) of a user.
 */
export const userMaritalStatusEnum = pgEnum("user_marital_status", [
	"divorced",
	"engaged",
	"married",
	"seperated",
	"single",
	"widowed",
]);
