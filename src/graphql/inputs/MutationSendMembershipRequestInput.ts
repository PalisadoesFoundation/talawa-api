import type { z } from "zod";
import { membershipRequestsTableInsertSchema } from "~/src/drizzle/tables/membershipRequests";
import { builder } from "~/src/graphql/builder";

export const sendMembershipRequestInputSchema =
	membershipRequestsTableInsertSchema.pick({
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
