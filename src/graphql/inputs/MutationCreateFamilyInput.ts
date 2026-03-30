import { z } from "zod";
import { familyMembershipsTableInsertSchema } from "~/src/drizzle/tables/familyMemberships";
import { builder } from "~/src/graphql/builder";
import { FamilyMembershipRole } from "~/src/graphql/enums/FamilyMembershipRole";

const memberSchema = z.object({
	memberId: z.uuid(),
	role: familyMembershipsTableInsertSchema.shape.role,
});

export const mutationCreateFamilyInputSchema = z.object({
	organizationId: z.uuid(),
	members: z.array(memberSchema).min(2),
});

export const MutationCreateFamilyInput = builder
	.inputRef<z.infer<typeof mutationCreateFamilyInputSchema>>(
		"MutationCreateFamilyInput",
	)
	.implement({
		description: "Input for creating a family with at least two members.",
		fields: (t) => ({
			organizationId: t.id({
				description: "ID of the organization context.",
				required: true,
			}),

			members: t.field({
				type: [
					builder
						.inputRef<{
							memberId: string;
							role: typeof FamilyMembershipRole.$inferType;
						}>("FamilyMemberInput")
						.implement({
							fields: (t) => ({
								memberId: t.id({ required: true }),
								role: t.field({
									type: FamilyMembershipRole,
									required: true,
								}),
							}),
						}),
				],
				required: true,
			}),
		}),
	});
