import { venueAttachmentTypeEnum } from "~/src/drizzle/enums/venueAttachmentType";
import { builder } from "~/src/graphql/builder";

export const VenueAttachmentType = builder.enumType("VenueAttachmentType", {
	description: "",
	values: venueAttachmentTypeEnum.options,
});
