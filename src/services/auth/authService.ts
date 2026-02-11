import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import type { FastifyBaseLogger, FastifyReply } from "fastify";
import { uuidv7 } from "uuidv7";
import { usersTable } from "~/src/drizzle/tables/users";
import type { DrizzleClient } from "~/src/fastifyPlugins/drizzleClient";
import {
	COOKIE_NAMES,
	type CookieConfigOptions,
	getAccessTokenCookieOptions,
	getClearAccessTokenCookieOptions,
	getClearRefreshTokenCookieOptions,
	getRefreshTokenCookieOptions,
} from "~/src/utilities/cookieConfig";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaRestError } from "~/src/utilities/errors/TalawaRestError";
import { hashPassword, verifyPassword } from "./password";
import {
	isRefreshTokenValid,
	persistRefreshToken,
	revokeRefreshToken,
} from "./refreshStore";
import {
	getAccessTtlSec,
	getRefreshTtlSec,
	type RefreshClaims,
	signAccessToken,
	signRefreshToken,
	verifyToken,
} from "./tokens";

function getDefaultCookieOptions(): CookieConfigOptions {
	return {
		domain: process.env.API_COOKIE_DOMAIN,
		// Omission of API_IS_SECURE_COOKIES defaults to secure cookies (true); only the literal string "false" disables.
		isSecure: process.env.API_IS_SECURE_COOKIES !== "false",
		path: "/",
	};
}

function buildName(firstName: string, lastName: string, email: string): string {
	const parts = [firstName, lastName].filter(Boolean).join(" ").trim();
	return parts || email;
}

export interface SignUpInput {
	email: string;
	password: string;
	firstName: string;
	lastName: string;
}

export type SignUpResult =
	| { user: typeof usersTable.$inferSelect }
	| { error: "already_exists" };

/**
 * Registers a new user.
 *
 * @param db - Drizzle client for database access.
 * @param log - Logger for error reporting (e.g. registration failures).
 * @param input - SignUpInput (email, password, firstName, lastName).
 * @returns Promise resolving to SignUpResult: either `{ user }` with the created user row, or `{ error: "already_exists" }` if the email is already registered. Throws TalawaRestError (INTERNAL_SERVER_ERROR) if insert returns no row.
 */
export async function signUp(
	db: DrizzleClient,
	log: FastifyBaseLogger,
	input: SignUpInput,
): Promise<SignUpResult> {
	const existing = await db.query.usersTable.findFirst({
		where: eq(usersTable.emailAddress, input.email),
	});
	if (existing) {
		return { error: "already_exists" };
	}

	const passwordHash = await hashPassword(input.password);
	const userId = uuidv7();
	const name = buildName(input.firstName, input.lastName, input.email);

	try {
		const [user] = await db
			.insert(usersTable)
			.values({
				creatorId: userId,
				emailAddress: input.email,
				id: userId,
				isEmailAddressVerified: false,
				name,
				passwordHash,
				role: "regular",
			})
			.returning();

		if (!user) {
			throw new TalawaRestError({
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				message: "Insert usersTable returned no row",
			});
		}
		return { user };
	} catch (err) {
		const code =
			(err as { code?: string }).code ??
			(err as { cause?: { code?: string } }).cause?.code;
		if (code === "23505") {
			return { error: "already_exists" };
		}
		if (err instanceof TalawaRestError) {
			throw err;
		}
		log.error({ err }, "User registration failed");
		throw new TalawaRestError({
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "User registration failed",
		});
	}
}

export interface SignInInput {
	email: string;
	password: string;
	ip?: string;
	userAgent?: string;
}

export type SignInResult =
	| {
			user: typeof usersTable.$inferSelect;
			access: string;
			refresh: string;
	  }
	| { error: "invalid_credentials" };

/**
 * Authenticates a user by email and password.
 *
 * @param db - Drizzle client for database access.
 * @param log - Logger for error reporting (e.g. persist failures).
 * @param input - SignInInput (email, password; optional ip, userAgent).
 * @returns Promise resolving to SignInResult: either `{ user, access, refresh }` with the user row and JWT strings, or `{ error: "invalid_credentials" }` if the user is not found or the password does not match.
 */
export async function signIn(
	db: DrizzleClient,
	log: FastifyBaseLogger,
	input: SignInInput,
): Promise<SignInResult> {
	const user = await db.query.usersTable.findFirst({
		where: eq(usersTable.emailAddress, input.email),
	});
	if (!user?.passwordHash) {
		return { error: "invalid_credentials" };
	}

	const ok = await verifyPassword(user.passwordHash, input.password);
	if (!ok) {
		return { error: "invalid_credentials" };
	}

	const access = await signAccessToken({
		id: user.id,
		email: user.emailAddress,
	});
	const jti = randomUUID();
	const refresh = await signRefreshToken(user.id, jti);
	try {
		await persistRefreshToken(db, {
			token: refresh,
			userId: user.id,
			ip: input.ip,
			userAgent: input.userAgent,
			ttlSec: getRefreshTtlSec(),
		});
	} catch (err) {
		log.debug({ err }, "persistRefreshToken failed during signIn");
		throw new TalawaRestError({
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "Failed to persist new refresh token",
		});
	}

	return { user, access, refresh };
}

export type RotateRefreshResult =
	| { access: string; refresh: string; userId: string }
	| { error: "invalid_refresh" };

/**
 * Rotates a refresh token: revokes the old one and issues new access and refresh tokens.
 *
 * @param db - Drizzle client for database access.
 * @param log - Logger for debug output (e.g. verification failures).
 * @param token - Raw refresh JWT string; empty or whitespace-only is rejected without calling verifyToken.
 * @returns Promise resolving to RotateRefreshResult: either `{ access, refresh, userId }` with new tokens, or `{ error: "invalid_refresh" }` if the token is expired, invalid, wrong typ, not valid in DB, or the user is not found.
 */
export async function rotateRefresh(
	db: DrizzleClient,
	log: FastifyBaseLogger,
	token: string,
): Promise<RotateRefreshResult> {
	if (!token || !token.trim()) {
		return { error: "invalid_refresh" };
	}
	let payload: RefreshClaims;
	try {
		payload = await verifyToken<RefreshClaims>(token);
	} catch (err) {
		log.debug({ err }, "Refresh token verification failed");
		return { error: "invalid_refresh" };
	}

	if (payload.typ !== "refresh") {
		return { error: "invalid_refresh" };
	}

	const valid = await isRefreshTokenValid(db, token, payload.sub);
	if (!valid) {
		return { error: "invalid_refresh" };
	}

	const user = await db.query.usersTable.findFirst({
		where: eq(usersTable.id, payload.sub),
		columns: { id: true, emailAddress: true },
	});
	if (!user) {
		return { error: "invalid_refresh" };
	}

	// Issue and persist new tokens first so a failure does not leave the user without a valid refresh token.
	const access = await signAccessToken({
		id: user.id,
		email: user.emailAddress,
	});
	const jti = randomUUID();
	const refresh = await signRefreshToken(user.id, jti);
	try {
		await persistRefreshToken(db, {
			token: refresh,
			userId: user.id,
			ttlSec: getRefreshTtlSec(),
		});
	} catch (err) {
		log.debug({ err }, "persistRefreshToken failed during rotateRefresh");
		throw new TalawaRestError({
			code: ErrorCode.INTERNAL_SERVER_ERROR,
			message: "Failed to persist new refresh token",
		});
	}

	try {
		await revokeRefreshToken(db, token);
	} catch (err) {
		log.warn(
			{ err },
			"revokeRefreshToken failed after new token persisted; returning new tokens",
		);
	}

	return { access, refresh, userId: payload.sub };
}

export interface SetAuthCookiesTokens {
	access?: string;
	refresh?: string;
}

/**
 * Sets HTTP-only auth cookies on the reply.
 *
 * @param reply - Fastify reply instance to set cookies on.
 * @param tokens - SetAuthCookiesTokens; may contain access and/or refresh token strings; only present keys are set.
 * @param cookieOptions - Optional CookieConfigOptions (domain, isSecure, path); when omitted, built from process.env.
 * @returns void
 */
export function setAuthCookies(
	reply: FastifyReply,
	tokens: SetAuthCookiesTokens,
	cookieOptions?: CookieConfigOptions,
): void {
	const opts = cookieOptions ?? getDefaultCookieOptions();
	const accessTtlMs = getAccessTtlSec() * 1000;
	const refreshTtlMs = getRefreshTtlSec() * 1000;

	if (tokens.access) {
		reply.setCookie(COOKIE_NAMES.ACCESS_TOKEN, tokens.access, {
			...getAccessTokenCookieOptions(opts, accessTtlMs),
		});
	}
	if (tokens.refresh) {
		reply.setCookie(COOKIE_NAMES.REFRESH_TOKEN, tokens.refresh, {
			...getRefreshTokenCookieOptions(opts, refreshTtlMs),
		});
	}
}

/**
 * Clears auth cookies on the reply.
 *
 * @param reply - Fastify reply instance to clear cookies on.
 * @param cookieOptions - Optional CookieConfigOptions; when omitted, built from process.env so path/domain match setAuthCookies.
 * @returns void
 */
export function clearAuthCookies(
	reply: FastifyReply,
	cookieOptions?: CookieConfigOptions,
): void {
	const opts = cookieOptions ?? getDefaultCookieOptions();
	reply.clearCookie(
		COOKIE_NAMES.ACCESS_TOKEN,
		getClearAccessTokenCookieOptions(opts),
	);
	reply.clearCookie(
		COOKIE_NAMES.REFRESH_TOKEN,
		getClearRefreshTokenCookieOptions(opts),
	);
}
