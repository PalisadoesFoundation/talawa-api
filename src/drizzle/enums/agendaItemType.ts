import { z } from "zod";

/**
 * Possible variants of the type of an agenda item.
 */
export const agendaItemTypeEnum = z.enum([
	"general",
	"note",
	"scripture",
	"song",
]);
