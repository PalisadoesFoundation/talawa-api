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
 * Registers a new user. Returns the created user or already_exists if email is taken.
 */
export async function signUp(
	db: DrizzleClient,
	_log: FastifyBaseLogger,
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
 * Authenticates a user by email and password. Returns user and tokens or invalid_credentials.
 */
export async function signIn(
	db: DrizzleClient,
	_log: FastifyBaseLogger,
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
	await persistRefreshToken(db, {
		token: refresh,
		userId: user.id,
		ip: input.ip,
		userAgent: input.userAgent,
		ttlSec: getRefreshTtlSec(),
	});

	return { user, access, refresh };
}

export type RotateRefreshResult =
	| { access: string; refresh: string; userId: string }
	| { error: "invalid_refresh" };

/**
 * Rotates a refresh token: revokes the old one and issues new access and refresh tokens.
 * Returns invalid_refresh if the token is expired, invalid, wrong type, or not found in DB.
 */
export async function rotateRefresh(
	db: DrizzleClient,
	log: FastifyBaseLogger,
	token: string,
): Promise<RotateRefreshResult> {
	if (!token || typeof token !== "string" || !token.trim()) {
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

	await revokeRefreshToken(db, token);

	const user = await db.query.usersTable.findFirst({
		where: eq(usersTable.id, payload.sub),
		columns: { id: true, emailAddress: true },
	});
	if (!user) {
		return { error: "invalid_refresh" };
	}

	const access = await signAccessToken({
		id: user.id,
		email: user.emailAddress,
	});
	const jti = randomUUID();
	const refresh = await signRefreshToken(user.id, jti);
	await persistRefreshToken(db, {
		token: refresh,
		userId: user.id,
		ttlSec: getRefreshTtlSec(),
	});

	return { access, refresh, userId: payload.sub };
}

export interface SetAuthCookiesTokens {
	access?: string;
	refresh?: string;
}

/**
 * Sets HTTP-only auth cookies on the reply. When cookieOptions is omitted, builds options from process.env.
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
 * Clears auth cookies on the reply. Uses same path/domain as setAuthCookies when cookieOptions is omitted.
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
