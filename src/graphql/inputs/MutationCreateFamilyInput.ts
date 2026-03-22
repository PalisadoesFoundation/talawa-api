import type z from "zod";
import { familyMembershipsTableInsertSchema } from "~/src/drizzle/tables/familyMemberships";
import { builder } from "~/src/graphql/builder";
import { FamilyMembershipRole } from "~/src/graphql/enums/FamilyMembershipRole";

export const mutationCreateFamilyInputSchema =
	familyMembershipsTableInsertSchema
		.pick({
			organizationId: true,
			memberId: true,
		})
		.extend({
			role: familyMembershipsTableInsertSchema.shape.role,
		});

export const MutationCreateFamilyInput = builder
	.inputRef<z.infer<typeof mutationCreateFamilyInputSchema>>(
		"MutationCreateFamilyInput",
	)
	.implement({
		description: "Input for creating a family.",
		fields: (t) => ({
			organizationId: t.id({
				description:
					"Global identifier of the organization in which the family relationship is being created.",
				required: true,
			}),
			memberId: t.id({
				description: "ID of the user to add to the family.",
				required: true,
			}),
			role: t.field({
				description: "Role of the user in the family.",
				type: FamilyMembershipRole,
				required: true,
			}),
		}),
	});
