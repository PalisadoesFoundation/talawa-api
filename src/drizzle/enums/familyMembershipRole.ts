import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Possible variants of role in the family(if applicable) of a user.
 */
export const familyMembershipRoleEnum = pgEnum("family_membership_role", [
	"adult",
	"child",
	"head_of_household",
	"spouse",
]);
