import { z } from "zod";
import {
	NAME_MAX_LENGTH,
	PASSWORD_MAX_LENGTH,
	PASSWORD_MIN_LENGTH,
} from "~/src/utilities/auth/constants";

export { NAME_MAX_LENGTH, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH };

/** Zod schema for REST sign-up request body. Aligns with MutationSignUpInput password length. */
export const signUpBody = z.object({
	email: z
		.string()
		.email()
		.transform((e) => e.toLowerCase()),
	password: z
		.string()
		.min(
			PASSWORD_MIN_LENGTH,
			`Password must be at least ${PASSWORD_MIN_LENGTH} characters`,
		)
		.max(PASSWORD_MAX_LENGTH),
	firstName: z.string().trim().min(1).max(NAME_MAX_LENGTH),
	lastName: z.string().trim().min(1).max(NAME_MAX_LENGTH),
});

/** Zod schema for REST sign-in request body. */
export const signInBody = z.object({
	email: z
		.string()
		.email()
		.transform((e) => e.toLowerCase()),
	password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
});

/**
 * Zod schema for REST refresh-token request body.
 * In {@link refreshBody}, `refreshToken` is intentionally optional because the token may be
 * supplied either in the JSON body or via the HttpOnly cookie (e.g. `talawa_refresh_token`).
 * This is deliberate; do not tighten the schema so that both sources remain supported.
 */
export const refreshBody = z.object({
	refreshToken: z.string().min(1).optional(),
});

export type SignUpBody = z.infer<typeof signUpBody>;
export type SignInBody = z.infer<typeof signInBody>;
export type RefreshBody = z.infer<typeof refreshBody>;
