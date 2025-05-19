import { z } from "zod";

/**
 * Possible variants of the employment status(if applicable) of a user.
 */
export const userEmploymentStatusEnum = z.enum([
	"full_time",
	"part_time",
	"unemployed",
]);
