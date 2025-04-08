import { z } from "zod";
import { builder } from "~/src/graphql/builder";

export const rejectMembershipRequestInputSchema = z.object({
	membershipRequestId: z
		.string()
		.uuid("Membership request ID must be a valid UUID"),
});

export const MutationRejectMembershipRequestInput = builder.inputType(
	"MutationRejectMembershipRequestInput",
	{
		fields: (t) => ({
			membershipRequestId: t.field({
				type: "ID",
				required: true,
				description: "ID of the membership request to reject",
			}),
		}),
	},
);
