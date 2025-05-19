import { builder } from "~/src/graphql/builder";

// Define the response type for canceling a membership request
export const CancelMembershipResponse = builder
	.objectRef<{
		success: boolean;
		message: string;
	}>("CancelMembershipResponse")
	.implement({
		description: "Response type for canceling a membership request.",
		fields: (t) => ({
			success: t.exposeBoolean("success", {
				description:
					"Indicates whether the membership request was successfully canceled.",
			}),
			message: t.exposeString("message", {
				description:
					"A message providing more details about the cancellation status.",
			}),
		}),
	});
