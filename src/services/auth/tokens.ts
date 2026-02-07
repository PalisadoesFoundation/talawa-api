/**
 * REST auth JWT (jose): This module uses the "jose" library for signing and verifying
 * access/refresh tokens used by REST auth (src/services/auth). The "@fastify/jwt" dependency
 * is used elsewhere for GraphQL auth (src/routes/graphql). Both are kept; no migration planned.
 */
import { jwtVerify, SignJWT } from "jose";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaRestError } from "~/src/utilities/errors/TalawaRestError";
import { rootLogger } from "~/src/utilities/logging/logger";

const encoder = new TextEncoder();
const ISSUER = "talawa-api";

/**
 * ACCESS_TTL_SEC, REFRESH_TTL_SEC, and SECRET are read from process.env once at module load
 * and are immutable for the process lifetime. Changes to environment variables after import
 * have no effect. For runtime configurability, re-import the module or read env inside functions.
 */

const DEFAULT_ACCESS_TTL_SEC = 15 * 60;
const DEFAULT_REFRESH_TTL_SEC = 30 * 24 * 3600;

function parsePositiveSeconds(
	value: string | undefined,
	defaultSeconds: number,
): number {
	const n = Number(value ?? defaultSeconds);
	return Number.isFinite(n) && n > 0 ? n : defaultSeconds;
}

const ACCESS_TTL_SEC = parsePositiveSeconds(
	process.env.ACCESS_TOKEN_TTL,
	DEFAULT_ACCESS_TTL_SEC,
);
const REFRESH_TTL_SEC = parsePositiveSeconds(
	process.env.REFRESH_TOKEN_TTL,
	DEFAULT_REFRESH_TTL_SEC,
);

function getSecret(): Uint8Array {
	const raw = process.env.AUTH_JWT_SECRET;
	if (!raw) {
		if (process.env.NODE_ENV === "production") {
			throw new TalawaRestError({
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				message: "AUTH_JWT_SECRET must be set in production",
			});
		}
		rootLogger.warn(
			"AUTH_JWT_SECRET is unset; using dev default. Set AUTH_JWT_SECRET in production.",
		);
		return encoder.encode("dev-secret-change-me");
	}
	return encoder.encode(raw);
}

const SECRET = getSecret();

/** Payload shape for access tokens. */
export type AccessClaims = {
	sub: string;
	email: string;
	typ: "access";
	ver: 1;
};

/** Payload shape for refresh tokens. */
export type RefreshClaims = {
	sub: string;
	typ: "refresh";
	ver: 1;
	jti: string;
};

/**
 * Signs an access JWT for a user.
 * @param user - Object with id and email.
 * @returns Signed JWT string.
 */
export async function signAccessToken(user: {
	id: string;
	email: string;
}): Promise<string> {
	return new SignJWT({
		email: user.email,
		typ: "access",
		ver: 1,
	})
		.setSubject(user.id)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuer(ISSUER)
		.setIssuedAt()
		.setExpirationTime(`${ACCESS_TTL_SEC}s`)
		.sign(SECRET);
}

/**
 * Signs a refresh JWT for a user with a unique token id.
 * @param userId - User id (sub claim).
 * @param jti - Unique token id (e.g. for revocation).
 * @returns Signed JWT string.
 */
export async function signRefreshToken(
	userId: string,
	jti: string,
): Promise<string> {
	return new SignJWT({
		typ: "refresh",
		ver: 1,
	})
		.setSubject(userId)
		.setJti(jti)
		.setProtectedHeader({ alg: "HS256" })
		.setIssuer(ISSUER)
		.setIssuedAt()
		.setExpirationTime(`${REFRESH_TTL_SEC}s`)
		.sign(SECRET);
}

/**
 * Verifies a JWT and returns the payload. Throws on expired, wrong secret, or wrong issuer.
 * @param jwt - Raw JWT string.
 * @returns Decoded payload (typed by generic T).
 * @remarks The returned payload is not runtime-validated for `typ` (access vs refresh).
 * Callers must validate `payload.typ` themselves when distinguishing AccessClaims from RefreshClaims.
 * @todo Add an expectedTyp parameter and runtime payload.typ check (e.g. verifyToken(jwt, "access"))
 * to enforce access vs refresh token usage in route/middleware integration; validate payload.typ
 * before returning to avoid token-type confusion. Track: jwtVerify -> payload as T.
 */
export async function verifyToken<T = AccessClaims | RefreshClaims>(
	jwt: string,
): Promise<T> {
	const { payload } = await jwtVerify(jwt, SECRET, { issuer: ISSUER });
	return payload as T;
}
