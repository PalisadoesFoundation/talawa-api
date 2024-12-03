import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Possible variants of the role assigned to an organization member.
 */
export const organizationMembershipRoleEnum = pgEnum(
	"organization_membership_role",
	["administrator", "regular"],
);
