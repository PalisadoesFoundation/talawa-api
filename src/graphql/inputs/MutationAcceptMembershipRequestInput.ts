import { z } from "zod";
import { builder } from "~/src/graphql/builder";
import { uuid } from "~/src/graphql/validators/core";

export const acceptMembershipRequestInputSchema = z.object({
	membershipRequestId: uuid,
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
