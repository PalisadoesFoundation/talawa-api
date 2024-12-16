import { z } from "zod";

/**
 * Possible variants of the martial status(if applicable) of a user.
 */
export const userMaritalStatusEnum = z.enum([
	"divorced",
	"engaged",
	"married",
	"seperated",
	"single",
	"widowed",
]);
