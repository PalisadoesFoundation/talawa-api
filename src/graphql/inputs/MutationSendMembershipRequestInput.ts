import type { z } from "zod";
import { organizationMembershipsTableInsertSchema } from "~/src/drizzle/tables/organizationMemberships";
import { builder } from "~/src/graphql/builder";

export const sendMembershipRequestInputSchema =
	organizationMembershipsTableInsertSchema.pick({
		organizationId: true,
	});

export const MutationSendMembershipRequestInput = builder
	.inputRef<z.infer<typeof sendMembershipRequestInputSchema>>(
		"MutationSendMembershipRequestInput",
	)
	.implement({
		description: "Input type for sending a membership request.",
		fields: (t) => ({
			organizationId: t.id({
				description: "Global identifier of the organization.",
				required: true,
			}),
		}),
	});
