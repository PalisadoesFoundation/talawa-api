import type { z } from "zod";
import { organizationMembershipsTableInsertSchema } from "~/src/drizzle/tables/organizationMemberships";
import { builder } from "~/src/graphql/builder";
import { OrganizationMembershipRole } from "~/src/graphql/enums/OrganizationMembershipRole";

export const mutationUpdateOrganizationMembershipInputSchema =
	organizationMembershipsTableInsertSchema
		.pick({
			memberId: true,
			organizationId: true,
		})
		.extend({
			role: organizationMembershipsTableInsertSchema.shape.role.optional(),
		})
		.refine(
			({ memberId, organizationId, ...remainingArg }) =>
				Object.values(remainingArg).some((value) => value !== undefined),
			{
				message: "At least one optional argument must be provided.",
			},
		);

export const MutationUpdateOrganizationMembershipInput = builder
	.inputRef<z.infer<typeof mutationUpdateOrganizationMembershipInputSchema>>(
		"MutationUpdateOrganizationMembershipInput",
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
			role: t.field({
				description: "Role assigned to the user within the organization.",
				type: OrganizationMembershipRole,
			}),
		}),
	});
