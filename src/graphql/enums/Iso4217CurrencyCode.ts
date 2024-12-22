import { iso4217CurrencyCodeEnum } from "~/src/drizzle/enums/iso4217CurrencyCode";
import { builder } from "~/src/graphql/builder";

export const Iso4217CurrencyCode = builder.enumType("Iso4217CurrencyCode", {
	description: "",
	values: iso4217CurrencyCodeEnum.options,
});
