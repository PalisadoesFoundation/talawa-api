import type { advertisementsTable } from "~/src/drizzle/tables/advertisements";
import { builder } from "~/src/graphql/builder";
import { AdvertisementType } from "~/src/graphql/enums/AdvertisementType";
import {
	AdvertisementAttachment,
	type AdvertisementAttachment as AdvertisementAttachmentType,
} from "~/src/graphql/types/AdvertisementAttachment/AdvertisementAttachment";

export type Advertisement = typeof advertisementsTable.$inferSelect & {
	attachments: AdvertisementAttachmentType[] | null;
};

export const Advertisement = builder.objectRef<Advertisement>("Advertisement");

Advertisement.implement({
	description:
		"Advertisements are a way for an organization to gather funds by advertising them to its members.",
	fields: (t) => ({
		attachments: t.expose("attachments", {
			description: "Array of attachments.",
			type: t.listRef(AdvertisementAttachment),
		}),
		description: t.exposeString("description", {
			description: "Custom information about the advertisement.",
		}),
		endAt: t.expose("endAt", {
			description: "Date time at the time the advertised event ends at.",
			type: "DateTime",
		}),
		id: t.exposeID("id", {
			description: "Global identifier of the advertisement.",
			nullable: false,
		}),
		name: t.exposeString("name", {
			description: "Name of the advertisement.",
		}),
		startAt: t.expose("startAt", {
			description: "Date time at the time the advertised event starts at.",
			type: "DateTime",
		}),
		type: t.expose("type", {
			description: "Type of the advertisement.",
			type: AdvertisementType,
		}),
	}),
});
