import { builder } from "~/src/graphql/builder";

export const AcceptMembershipResponse = builder.objectRef<{
	success: boolean;
	message: string;
}>("AcceptMembershipResponse");

AcceptMembershipResponse.implement({
	fields: (t) => ({
		success: t.exposeBoolean("success", {
			description: "Whether the operation was successful",
		}),
		message: t.exposeString("message", {
			description: "Success or error message",
		}),
	}),
});
