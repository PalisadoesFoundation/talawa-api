import { iso3166Alpha2CountryCodeEnum } from "~/src/drizzle/enums/iso3166Alpha2CountryCode";
import { builder } from "~/src/graphql/builder";

export const Iso3166Alpha2CountryCode = builder.enumType(
	"Iso3166Alpha2CountryCode",
	{
		description: "",
		values: iso3166Alpha2CountryCodeEnum.enumValues,
	},
);
