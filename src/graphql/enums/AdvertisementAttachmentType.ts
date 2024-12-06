import { advertisementAttachmentTypeEnum } from "~/src/drizzle/enums/advertisementAttachmentType";
import { builder } from "~/src/graphql/builder";

export const AdvertisementAttachmentType = builder.enumType(
	"AdvertisementAttachmentType",
	{
		description: "",
		values: advertisementAttachmentTypeEnum.enumValues,
	},
);
