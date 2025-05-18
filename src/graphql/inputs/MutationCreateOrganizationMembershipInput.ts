import type { z } from "zod";
import { organizationMembershipsTableInsertSchema } from "~/src/drizzle/tables/organizationMemberships";
import { builder } from "~/src/graphql/builder";
import { OrganizationMembershipRole } from "~/src/graphql/enums/OrganizationMembershipRole";

export const mutationCreateOrganizationMembershipInputSchema =
	organizationMembershipsTableInsertSchema
		.pick({
			memberId: true,
			organizationId: true,
		})
		.extend({
			role: organizationMembershipsTableInsertSchema.shape.role.optional(),
		});

export const MutationCreateOrganizationMembershipInput = builder
	.inputRef<z.infer<typeof mutationCreateOrganizationMembershipInputSchema>>(
		"MutationCreateOrganizationMembershipInput",
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
