import { z } from "zod";
import { eventsTableInsertSchema } from "~/src/drizzle/tables/events";
import { builder } from "~/src/graphql/builder";

export const queryEventInputSchema = z.object({
	id: eventsTableInsertSchema.shape.id.unwrap(),
});

export const QueryEventInput = builder
	.inputRef<z.infer<typeof queryEventInputSchema>>("QueryEventInput")
	.implement({
		description: "",
		fields: (t) => ({
			id: t.string({
				description: "Global id of the event.",
				required: true,
			}),
		}),
	});
