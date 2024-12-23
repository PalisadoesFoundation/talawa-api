import { eventAttachmentTypeEnum } from "~/src/drizzle/enums/eventAttachmentType";
import { builder } from "~/src/graphql/builder";

export const EventAttachmentType = builder.enumType("EventAttachmentType", {
	description: "",
	values: eventAttachmentTypeEnum.options,
});
