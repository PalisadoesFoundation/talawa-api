import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Possible variants of the role assigned to a user.
 */
export const userRoleEnum = pgEnum("user_role", ["administrator", "base"]);
