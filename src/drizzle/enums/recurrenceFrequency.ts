import { z } from "zod";

/**
 * Possible variants of the frequency of a recurring event.
 */
export const recurrenceFrequencyEnum = z.enum([
	"DAILY",
	"WEEKLY",
	"MONTHLY",
	"YEARLY",
]);
