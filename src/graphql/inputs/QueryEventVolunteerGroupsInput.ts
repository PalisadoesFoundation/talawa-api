import { z } from "zod";
import { volunteerGroupsTableInsertSchema } from "~/src/drizzle/tables/volunteerGroups";
import { builder } from "~/src/graphql/builder";

export const queryEventVolunteerGroupsInputSchema = z.object({
	eventId: volunteerGroupsTableInsertSchema.shape.eventId,
});

export const QueryEventVolunteerGroupsInput = builder
	.inputRef<z.infer<typeof queryEventVolunteerGroupsInputSchema>>(
		"QueryEventVolunteerGroupsInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			eventId: t.string({
				description: "Global id of the event.",
				required: true,
			}),
		}),
	});
