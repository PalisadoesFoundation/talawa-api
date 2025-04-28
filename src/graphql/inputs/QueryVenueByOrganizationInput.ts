import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { QueryVenueOrderByInput } from "./QueryVenueOrderByInput";
import { QueryVenueOrderByInputSchema } from "./QueryVenueOrderByInput";
import { QueryVenueWhereInput } from "./QueryVenueWhereInput";
import { QueryVenueWhereInputSchema } from "./QueryVenueWhereInput";

export const QueryVenuesByOrganizationInputSchema = z.object({
	organizationId: z.string(),
	first: z.number().int().nonnegative().optional(),
	skip: z.number().int().nonnegative().optional(),
	orderBy: QueryVenueOrderByInputSchema.optional(),
	where: QueryVenueWhereInputSchema.optional(),
});

export const QueryVenuesByOrganizationInput = builder
	.inputRef<z.infer<typeof QueryVenuesByOrganizationInputSchema>>(
    "QueryVenuesByOrganizationInput"
	)
	.implement({
		description: "Input for querying venues by organization ID.",
		fields: (t) => ({
			organizationId: t.id({
				description: "Global ID of the organization.",
				required: true,
			}),
			first: t.int({
				description: "Number of venues to fetch.",
				required: false,
			}),
			skip: t.int({
				description: "Number of venues to skip from the start.",
				required: false,
			}),
			orderBy: t.field({
				type: QueryVenueOrderByInput,
				description: "Sorting criteria for venues.",
				required: false,
			}),
			where: t.field({
				type: QueryVenueWhereInput,
				description: "Filter criteria for venues.",
				required: false,
			}),
		}),
	});
