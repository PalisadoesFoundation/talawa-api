import { advertisementTypeEnum } from "~/src/drizzle/enums/advertisementType";
import { builder } from "~/src/graphql/builder";

export const AdvertisementType = builder.enumType("AdvertisementType", {
	description: "",
	values: advertisementTypeEnum.enumValues,
});
