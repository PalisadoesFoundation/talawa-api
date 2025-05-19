import { z } from "zod";

/**
 * Possible variants of the type of an advertisement.
 */
export const advertisementTypeEnum = z.enum(["banner", "menu", "pop_up"]);
