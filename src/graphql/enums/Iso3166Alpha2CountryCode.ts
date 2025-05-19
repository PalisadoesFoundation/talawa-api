import { iso3166Alpha2CountryCodeEnum } from "~/src/drizzle/enums/iso3166Alpha2CountryCode";
import { builder } from "~/src/graphql/builder";

export const Iso3166Alpha2CountryCode = builder.enumType(
	"Iso3166Alpha2CountryCode",
	{
		description:
			"Possible variants of the two-letter country code defined in ISO 3166-1, part of the ISO 3166 standard published by the International Organization for Standardization (ISO), to represent countries, dependent territories, and special areas of geographical interest.",
		values: iso3166Alpha2CountryCodeEnum.options,
	},
);
