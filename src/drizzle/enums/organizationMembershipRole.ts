import { z } from "zod";

/**
 * Possible variants of the role assigned to a user within an organization.
 */
export const organizationMembershipRoleEnum = z.enum([
	"administrator",
	"regular",
]);
