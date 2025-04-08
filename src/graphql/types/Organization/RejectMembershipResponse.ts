import { builder } from "~/src/graphql/builder";

export const RejectMembershipResponse = builder.objectRef<{
	success: boolean;
	message: string;
}>("RejectMembershipResponse");

RejectMembershipResponse.implement({
	fields: (t) => ({
		success: t.exposeBoolean("success", {
			description: "Whether the operation was successful",
		}),
		message: t.exposeString("message", {
			description: "Success or error message",
		}),
	}),
});
