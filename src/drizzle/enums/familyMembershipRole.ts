import { z } from "zod";

/**
 * Possible variants of the role of a user in a family(if applicable).
 */
export const familyMembershipRoleEnum = z.enum([
	"adult",
	"child",
	"head_of_household",
	"spouse",
]);
