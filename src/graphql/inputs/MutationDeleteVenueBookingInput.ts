import type { z } from "zod";
import { venueBookingsTableInsertSchema } from "~/src/drizzle/tables/venueBookings";
import { builder } from "~/src/graphql/builder";

export const mutationDeleteVenueBookingInputSchema =
	venueBookingsTableInsertSchema.pick({
		eventId: true,
		venueId: true,
	});

export const MutationDeleteVenueBookingInput = builder
	.inputRef<z.infer<typeof mutationDeleteVenueBookingInputSchema>>(
		"MutationDeleteVenueBookingInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			eventId: t.id({
				description: "Global identifier of the associated event.",
				required: true,
			}),
			venueId: t.id({
				description: "Global identifier of the associated venue.",
				required: true,
			}),
		}),
	});
