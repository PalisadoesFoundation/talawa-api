import { z } from "zod";

/**
 * Possible variants of the sex assigned to a user at birth.
 */
export const userNatalSexEnum = z.enum(["female", "intersex", "male"]);
