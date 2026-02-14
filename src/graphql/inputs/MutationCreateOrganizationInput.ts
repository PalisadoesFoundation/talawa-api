import { z } from "zod";
import { organizationsTableInsertSchema } from "~/src/drizzle/tables/organizations";
import { builder } from "~/src/graphql/builder";
import { Iso3166Alpha2CountryCode } from "~/src/graphql/enums/Iso3166Alpha2CountryCode";
import {
	FileMetadataInput,
	fileMetadataInputSchema,
} from "./FileMetadataInput";

export const mutationCreateOrganizationInputSchema =
	organizationsTableInsertSchema
		.pick({
			addressLine1: true,
			addressLine2: true,
			city: true,
			countryCode: true,
			description: true,
			name: true,
			postalCode: true,
			state: true,
		})
		.extend({
			avatar: fileMetadataInputSchema.nullish(),
			isUserRegistrationRequired: z.boolean().nullish(),
		});

export const MutationCreateOrganizationInput = builder
	.inputRef<z.infer<typeof mutationCreateOrganizationInputSchema>>(
		"MutationCreateOrganizationInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			addressLine1: t.string({
				description: "Address line 1 of the organization's address.",
			}),
			addressLine2: t.string({
				description: "Address line 2 of the organization's address.",
			}),
			avatar: t.field({
				description: "Avatar of the organization.",
				type: FileMetadataInput,
			}),
			city: t.string({
				description: "Name of the city where the organization resides in.",
			}),
			countryCode: t.field({
				description:
					"Country code of the country the organization is a citizen of.",
				type: Iso3166Alpha2CountryCode,
			}),
			description: t.string({
				description: "Custom information about the organization.",
			}),
			name: t.string({
				description: "Name of the organization.",
				required: true,
			}),
			postalCode: t.string({
				description: "Postal code of the organization.",
			}),
			isUserRegistrationRequired: t.boolean({
				description:
					"Flag to indicate if user registration is required to access the organization.",
			}),
			state: t.string({
				description: "Name of the state the organization resides in.",
			}),
		}),
	});
