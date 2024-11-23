import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Possible variants of type of recurrence of an event.
 */
export const recurrenceTypeEnum = pgEnum("recurrence_type", [
	"daily",
	"monthly",
	"weekly",
	"yearly",
]);
