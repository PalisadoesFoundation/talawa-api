import type { FileUpload } from "graphql-upload-minimal";
import { z } from "zod";
import { organizationsTableInsertSchema } from "~/src/drizzle/tables/organizations";
import { builder } from "~/src/graphql/builder";
import { Iso3166Alpha2CountryCode } from "~/src/graphql/enums/Iso3166Alpha2CountryCode";
import { sanitizedStringSchema } from "~/src/utilities/sanitizer";

export const mutationUpdateOrganizationInputSchema =
	organizationsTableInsertSchema
		.pick({
			countryCode: true,
		})
		.extend({
			addressLine1: sanitizedStringSchema.optional(),
			addressLine2: sanitizedStringSchema.optional(),
			avatar: z.custom<Promise<FileUpload>>().nullish(),
			city: sanitizedStringSchema.optional(),
			description: sanitizedStringSchema.optional(),
			id: organizationsTableInsertSchema.shape.id.unwrap(),
			isUserRegistrationRequired: z.boolean().optional(),
			name: sanitizedStringSchema.optional(),
			postalCode: sanitizedStringSchema.optional(),
			state: sanitizedStringSchema.optional(),
		})
		.refine(
			({ id, ...remainingArg }) =>
				Object.values(remainingArg).some((value) => value !== undefined),
			{
				message: "At least one optional argument must be provided.",
			},
		);

export const MutationUpdateOrganizationInput = builder
	.inputRef<z.infer<typeof mutationUpdateOrganizationInputSchema>>(
		"MutationUpdateOrganizationInput",
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
				type: "Upload",
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
			id: t.id({
				description: "Global identifier of the organization.",
				required: true,
			}),
			name: t.string({
				description: "Name of the organization.",
			}),
			postalCode: t.string({
				description: "Postal code of the organization.",
			}),
			state: t.string({
				description: "Name of the state the organization resides in.",
			}),
			isUserRegistrationRequired: t.boolean({
				description: "Is user registration required for this organization?",
			}),
		}),
	});
