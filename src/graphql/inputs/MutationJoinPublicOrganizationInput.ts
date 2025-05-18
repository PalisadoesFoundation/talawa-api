import type { z } from "zod";
import { organizationMembershipsTableInsertSchema } from "~/src/drizzle/tables/organizationMemberships";
import { builder } from "~/src/graphql/builder";

export const joinPublicOrganizationInputSchema =
	organizationMembershipsTableInsertSchema.pick({
		organizationId: true,
	});

export const MutationJoinPublicOrganizationInput = builder
	.inputRef<z.infer<typeof joinPublicOrganizationInputSchema>>(
		"MutationJoinPublicOrganizationInput",
	)
	.implement({
		description: "Input type for joining a public organization.",
		fields: (t) => ({
			organizationId: t.id({
				description: "Global identifier of the organization.",
				required: true,
			}),
		}),
	});
