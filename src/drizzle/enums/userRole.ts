import { z } from "zod";

/**
 * Possible variants of the role assigned to a user.
 */
export const userRoleEnum = z.enum(["administrator", "regular"]);
