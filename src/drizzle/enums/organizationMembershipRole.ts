import { z } from "zod";

/**
 * Possible variants of the role assigned to an organization member.
 */
export const organizationMembershipRoleEnum = z.enum([
	"administrator",
	"regular",
]);
