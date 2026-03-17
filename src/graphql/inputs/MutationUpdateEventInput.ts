import type { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { mutationUpdateEventInputSchema } from "./MutationUpdateEventInput.schema";

export { mutationUpdateEventInputSchema };

export const MutationUpdateEventInput = builder
	.inputRef<z.infer<typeof mutationUpdateEventInputSchema>>(
		"MutationUpdateEventInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			description: t.string({
				description: "Custom information about the event.",
			}),
			endAt: t.field({
				description:
					"UTC timestamp at the time the timed event ends. Only applicable when allDay is false.",
				type: "DateTime",
			}),
			startAt: t.field({
				description:
					"UTC timestamp at the time the timed event starts. Only applicable when allDay is false.",
				type: "DateTime",
			}),
			startDate: t.string({
				description:
					"Inclusive start date for all-day events (YYYY-MM-DD). Only applicable when allDay is true.",
				required: false,
			}),
			endDate: t.string({
				description:
					"Exclusive end date for all-day events (YYYY-MM-DD). Only applicable when allDay is true.",
				required: false,
			}),
			id: t.id({
				description: "Global identifier of the event.",
				required: true,
			}),
			name: t.string({
				description: "Name of the event.",
			}),
			allDay: t.boolean({
				description:
					"If true, converts the event to all-day (requires startDate/endDate). If false, converts to timed (requires startAt/endAt).",
			}),
			isInviteOnly: t.boolean({
				description: "Indicates if the event is invite-only",
				required: false,
			}),
			isPublic: t.boolean({
				description: "Indicates if the event is publicly visible.",
			}),
			isRegisterable: t.boolean({
				description: "Indicates if users can register for this event.",
			}),
			location: t.string({
				description: "Physical or virtual location of the event.",
			}),
		}),
	});
