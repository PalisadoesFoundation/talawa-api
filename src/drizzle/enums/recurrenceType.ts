import { z } from "zod";

/**
 * Possible variants of the type of recurrence of an event.
 */
export const recurrenceTypeEnum = z.enum([
	"daily",
	"monthly",
	"weekly",
	"yearly",
]);
