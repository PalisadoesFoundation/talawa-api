import { z } from "zod";

/**
 * Possible variants of the type of a chat.
 */
export const chatTypeEnum = z.enum(["direct", "group"]);
