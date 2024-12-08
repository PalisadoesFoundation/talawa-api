import type { z } from "zod";
import { organizationMembershipsTableInsertSchema } from "~/src/drizzle/tables/organizationMemberships";
import { builder } from "~/src/graphql/builder";

export const mutationDeleteOrganizationMembershipInputSchema =
	organizationMembershipsTableInsertSchema.pick({
		memberId: true,
		organizationId: true,
	});

export const MutationDeleteOrganizationMembershipInput = builder
	.inputRef<z.infer<typeof mutationDeleteOrganizationMembershipInputSchema>>(
		"MutationDeleteOrganizationMembershipInput",
	)
	.implement({
		description: "",
		fields: (t) => ({
			memberId: t.id({
				description: "Global identifier of the associated user.",
				required: true,
			}),
			organizationId: t.id({
				description: "Global identifier of the associated organization.",
				required: true,
			}),
		}),
	});
