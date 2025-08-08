import { iso4217CurrencyCodeEnum } from "~/src/drizzle/enums/iso4217CurrencyCode";
import { builder } from "~/src/graphql/builder";

export const Iso4217CurrencyCode = builder.enumType("Iso4217CurrencyCode", {
	description:
		"Possible variants of the currency code defined in ISO 4217 standard published by the International Organization for Standardization (ISO) which defines alpha codes and numeric codes for the representation of currencies and provides information about the relationships between individual currencies and their minor units.",
	values: iso4217CurrencyCodeEnum.options,
});
