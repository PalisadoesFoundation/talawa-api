import { jwtVerify, SignJWT } from "jose";

const encoder = new TextEncoder();
const ISSUER = "talawa-api";

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
const SECRET = encoder.encode(
	process.env.AUTH_JWT_SECRET ?? "dev-secret-change-me",
);

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
		sub: user.id,
		email: user.email,
		typ: "access",
		ver: 1,
	} satisfies AccessClaims)
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
		sub: userId,
		typ: "refresh",
		ver: 1,
		jti,
	} satisfies RefreshClaims)
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
 */
export async function verifyToken<T = AccessClaims | RefreshClaims>(
	jwt: string,
): Promise<T> {
	const { payload } = await jwtVerify(jwt, SECRET, { issuer: ISSUER });
	return payload as T;
}
