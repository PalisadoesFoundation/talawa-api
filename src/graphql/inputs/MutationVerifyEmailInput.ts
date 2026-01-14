import { z } from "zod";
import { builder } from "~/src/graphql/builder";

/**
 * GraphQL input type for verifyEmail mutation.
 */
export const MutationVerifyEmailInput = builder.inputType(
	"MutationVerifyEmailInput",
	{
		fields: (t) => ({
			token: t.field({
				description:
					"The email verification token received in the verification email.",
				required: true,
				type: "String",
			}),
		}),
	},
);

/**
 * Zod schema for mutation verify email input argument validation.
 */
export const mutationVerifyEmailInputSchema = z.object({
	/**
	 * The raw email verification token from the email link.
	 */
	token: z.string().length(64, "Invalid token length: expected 64 characters"),
});
