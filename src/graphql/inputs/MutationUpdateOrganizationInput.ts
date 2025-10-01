import type { FileUpload } from "graphql-upload-minimal";
import { z } from "zod";
import { organizationsTableInsertSchema } from "~/src/drizzle/tables/organizations";
import { builder } from "~/src/graphql/builder";
import { Iso3166Alpha2CountryCode } from "~/src/graphql/enums/Iso3166Alpha2CountryCode";

export const mutationUpdateOrganizationInputSchema =
	organizationsTableInsertSchema
		.pick({
			addressLine1: true,
			addressLine2: true,
			city: true,
			countryCode: true,
			description: true,
			postalCode: true,
			state: true,
		})
		.extend({
			avatar: z.custom<Promise<FileUpload>>().nullish(),
			id: organizationsTableInsertSchema.shape.id.unwrap(),
			name: organizationsTableInsertSchema.shape.name.optional(),
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
		}),
	});
