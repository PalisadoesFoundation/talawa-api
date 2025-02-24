import { z } from "zod";
import { builder } from "~/src/graphql/builder";

//query to fetch multiple organuisation by organisationID
export const queryAdvertisementsByOrgInputSchema = z.object({
	organizationId: z.string().uuid({
		message: "Invalid organization ID format.",
	}),
});

export const QueryAdvertisementsByOrgInput = builder
	.inputRef<z.infer<typeof queryAdvertisementsByOrgInputSchema>>(
		"QueryAdvertisementsByOrgInput",
	)
	.implement({
		description:
			"Input type for querying multiple advertisements by organization ID.",
		fields: (t) => ({
			organizationId: t.string({
				description: "Global identifier of the associated organization.",
				required: true,
			}),
		}),
	});
