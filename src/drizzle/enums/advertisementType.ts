import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Possible variants of the type of an advertisement.
 */
export const advertisementTypeEnum = pgEnum("advertisement_type", [
	"banner",
	"menu",
	"pop_up",
]);
