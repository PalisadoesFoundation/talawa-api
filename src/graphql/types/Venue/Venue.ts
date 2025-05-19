import type { venuesTable } from "~/src/drizzle/tables/venues";
import { builder } from "~/src/graphql/builder";
import {
	VenueAttachment,
	type VenueAttachment as VenueAttachmentType,
} from "~/src/graphql/types/VenueAttachment/VenueAttachment";

export type Venue = typeof venuesTable.$inferSelect & {
	attachments: VenueAttachmentType[] | null;
};

export const Venue = builder.objectRef<Venue>("Venue");

Venue.implement({
	description:
		"Venues are physical locations associated to organizations where they conduct their events.",
	fields: (t) => ({
		attachments: t.expose("attachments", {
			description: "Array of attachments.",
			type: t.listRef(VenueAttachment),
		}),
		description: t.exposeString("description", {
			description: "Custom information about the venue.",
		}),
		id: t.exposeID("id", {
			description: "Global identifier of the venue.",
			nullable: false,
		}),
		name: t.exposeString("name", {
			description: "Name of the venue.",
		}),
	}),
});
