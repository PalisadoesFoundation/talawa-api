import { iso639Set1LanguageCodeEnum } from "~/src/drizzle/enums/iso639Set1LanguageCode";
import { builder } from "~/src/graphql/builder";

export const Iso639Set1LanguageCode = builder.enumType(
	"Iso639Set1LanguageCode",
	{
		description:
			"Possible variants of the two-letter language code defined in ISO 639-1, part of the ISO 639 standard published by the International Organization for Standardization (ISO), to represent natural languages.",
		values: iso639Set1LanguageCodeEnum.options,
	},
);
