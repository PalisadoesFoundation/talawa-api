import { z } from "zod";

/**
 * Possible variants of the role assigned to a user within a chat.
 */
export const chatMembershipRoleEnum = z.enum(["administrator", "regular"]);
