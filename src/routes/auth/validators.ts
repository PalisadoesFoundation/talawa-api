import { z } from "zod";

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 64;
const NAME_MAX_LENGTH = 50;

/** Zod schema for REST sign-up request body. Aligns with MutationSignUpInput password length. */
export const signUpBody = z.object({
	email: z.string().email(),
	password: z
		.string()
		.min(PASSWORD_MIN_LENGTH, "Password must be at least 8 characters")
		.max(PASSWORD_MAX_LENGTH),
	firstName: z.string().min(1).max(NAME_MAX_LENGTH),
	lastName: z.string().min(1).max(NAME_MAX_LENGTH),
});

/** Zod schema for REST sign-in request body. */
export const signInBody = z.object({
	email: z.string().email(),
	password: z.string().min(1),
});

/** Zod schema for REST refresh-token request body. */
export const refreshBody = z.object({
	refreshToken: z.string().optional(),
});

export type SignUpBody = z.infer<typeof signUpBody>;
export type SignInBody = z.infer<typeof signInBody>;
export type RefreshBody = z.infer<typeof refreshBody>;
