import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { uuid } from "~/src/graphql/validators/core";

export const cancelMembershipRequestInputSchema = z.object({
	membershipRequestId: uuid,
});

export const MutationCancelMembershipRequestInput = builder
	.inputRef<z.infer<typeof cancelMembershipRequestInputSchema>>(
		"MutationCancelMembershipRequestInput",
	)
	.implement({
		description: "Input type for canceling a membership request.",
		fields: (t) => ({
			membershipRequestId: t.id({
				description: "Global identifier of the membership request.",
				required: true,
			}),
		}),
	});
