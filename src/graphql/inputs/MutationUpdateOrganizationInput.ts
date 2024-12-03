import type { z } from "zod";
import { organizationsTableInsertSchema } from "~/src/drizzle/tables/organizations";
import { builder } from "~/src/graphql/builder";
import { Iso3166Alpha2CountryCode } from "~/src/graphql/enums/Iso3166Alpha2CountryCode";

export const mutationUpdateOrganizationInputSchema =
	organizationsTableInsertSchema
		.omit({
			createdAt: true,
			creatorId: true,
			id: true,
			name: true,
			updatedAt: true,
			updaterId: true,
		})
		.extend({
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
			address: t.string({
				description: "Address of the organization.",
			}),
			avatarURI: t.string({
				description: "URI to the avatar of the organization.",
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
