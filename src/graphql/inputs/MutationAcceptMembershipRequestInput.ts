import { z } from "zod";
import { builder } from "~/src/graphql/builder";

export const acceptMembershipRequestInputSchema = z.object({
	membershipRequestId: z
		.string()
		.uuid("Membership request ID must be a valid UUID"),
});

export const MutationAcceptMembershipRequestInput = builder.inputType(
	"MutationAcceptMembershipRequestInput",
	{
		fields: (t) => ({
			membershipRequestId: t.field({
				type: "ID",
				required: true,
				description: "ID of the membership request to accept",
			}),
		}),
	},
);
