import { z } from "zod";

/**
 * Possible variants of the role assigned to a chat member.
 */
export const chatMembershipRoleEnum = z.enum(["administrator", "regular"]);
