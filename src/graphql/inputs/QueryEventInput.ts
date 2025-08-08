import { z } from "zod";
import { builder } from "~/src/graphql/builder";

export const queryEventInputSchema = z.object({
	// Allow both UUID (real events) and virtual instance IDs (base-id:timestamp)
	id: z.string().min(1),
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
