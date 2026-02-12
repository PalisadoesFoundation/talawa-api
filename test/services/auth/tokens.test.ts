import {
	JWSSignatureVerificationFailed,
	JWTClaimValidationFailed,
	JWTExpired,
} from "jose/errors";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AccessClaims, RefreshClaims } from "~/src/services/auth";

const FIXED_SECRET = "test-secret-for-unit-tests";

describe("auth/tokens", () => {
	const originalSecret = process.env.API_AUTH_JWT_SECRET;
	const originalAccessTtl = process.env.API_ACCESS_TOKEN_TTL;
	const originalRefreshTtl = process.env.API_REFRESH_TOKEN_TTL;
	const originalNodeEnv = process.env.NODE_ENV;

	beforeEach(() => {
		process.env.API_AUTH_JWT_SECRET = FIXED_SECRET;
		delete process.env.API_ACCESS_TOKEN_TTL;
		delete process.env.API_REFRESH_TOKEN_TTL;
		process.env.NODE_ENV = "test";
		vi.resetModules();
	});

	afterEach(() => {
		if (originalSecret !== undefined) {
			process.env.API_AUTH_JWT_SECRET = originalSecret;
		} else {
			delete process.env.API_AUTH_JWT_SECRET;
		}
		if (originalAccessTtl !== undefined) {
			process.env.API_ACCESS_TOKEN_TTL = originalAccessTtl;
		} else {
			delete process.env.API_ACCESS_TOKEN_TTL;
		}
		if (originalRefreshTtl !== undefined) {
			process.env.API_REFRESH_TOKEN_TTL = originalRefreshTtl;
		} else {
			delete process.env.API_REFRESH_TOKEN_TTL;
		}
		if (originalNodeEnv !== undefined) {
			process.env.NODE_ENV = originalNodeEnv;
		} else {
			delete process.env.NODE_ENV;
		}
		vi.resetModules();
	});

	async function getTokens() {
		return import("~/src/services/auth");
	}

	describe("sign and verify round-trip", () => {
		it("access token: signAccessToken and verifyToken return expected claims (sub, email, typ, ver)", async () => {
			const { signAccessToken, verifyToken } = await getTokens();
			const user = { id: "user-1", email: "u@example.com" };
			const token = await signAccessToken(user);
			expect(token).toBeTruthy();
			expect(typeof token).toBe("string");
			const payload = await verifyToken<AccessClaims>(token);
			expect(payload.sub).toBe(user.id);
			expect(payload.email).toBe(user.email);
			expect(payload.typ).toBe("access");
			expect(payload.ver).toBe(1);
		});

		it("refresh token: signRefreshToken and verifyToken return expected claims (sub, typ, ver, jti)", async () => {
			const { signRefreshToken, verifyToken } = await getTokens();
			const userId = "user-1";
			const jti = "refresh-jti-123";
			const token = await signRefreshToken(userId, jti);
			expect(token).toBeTruthy();
			const payload = await verifyToken<RefreshClaims>(token);
			expect(payload.sub).toBe(userId);
			expect(payload.typ).toBe("refresh");
			expect(payload.ver).toBe(1);
			expect(payload.jti).toBe(jti);
		});
	});

	describe("verifyToken", () => {
		it("throws on wrong secret", async () => {
			const { signAccessToken } = await getTokens();
			const token = await signAccessToken({ id: "u1", email: "a@b.co" });
			process.env.API_AUTH_JWT_SECRET = "different-secret";
			vi.resetModules();
			const { verifyToken } = await getTokens();
			await expect(verifyToken(token)).rejects.toThrow(
				JWSSignatureVerificationFailed,
			);
		});

		it("throws on expired token", async () => {
			const { SignJWT } = await import("jose");
			const encoder = new TextEncoder();
			const secret = encoder.encode(FIXED_SECRET);
			const pastExp = 1_000_000; // Fixed timestamp so test is deterministic
			const expired = await new SignJWT({
				sub: "u1",
				email: "a@b.co",
				typ: "access",
				ver: 1,
			})
				.setProtectedHeader({ alg: "HS256" })
				.setIssuer("talawa-api")
				.setIssuedAt()
				.setExpirationTime(pastExp)
				.sign(secret);

			const { verifyToken } = await getTokens();
			await expect(verifyToken(expired)).rejects.toThrow(JWTExpired);
		});

		it("throws on wrong issuer", async () => {
			const { SignJWT } = await import("jose");
			const encoder = new TextEncoder();
			const secret = encoder.encode(FIXED_SECRET);
			const wrongIssuer = await new SignJWT({
				sub: "u1",
				email: "a@b.co",
				typ: "access",
				ver: 1,
			})
				.setProtectedHeader({ alg: "HS256" })
				.setIssuer("other-issuer")
				.setIssuedAt()
				.setExpirationTime("1h")
				.sign(secret);

			const { verifyToken } = await getTokens();
			await expect(verifyToken(wrongIssuer)).rejects.toThrow(
				JWTClaimValidationFailed,
			);
		});

		it("throws on malformed JWT string", async () => {
			const { verifyToken } = await getTokens();
			await expect(verifyToken("")).rejects.toThrow();
			await expect(verifyToken("not-a-valid-jwt")).rejects.toThrow();
		});
	});

	describe("default secret when API_AUTH_JWT_SECRET unset", () => {
		it("uses default secret and can sign and verify", async () => {
			process.env.NODE_ENV = "test";
			delete process.env.API_AUTH_JWT_SECRET;
			vi.resetModules();
			const { signAccessToken, verifyToken } = await import(
				"~/src/services/auth"
			);
			const token = await signAccessToken({
				id: "u1",
				email: "a@b.co",
			});
			const payload = await verifyToken<AccessClaims>(token);
			expect(payload.sub).toBe("u1");
			expect(payload.typ).toBe("access");
		});
	});

	describe("production guard when API_AUTH_JWT_SECRET unset", () => {
		it("throws TalawaRestError when NODE_ENV is production and API_AUTH_JWT_SECRET is unset", async () => {
			process.env.NODE_ENV = "production";
			delete process.env.API_AUTH_JWT_SECRET;
			vi.resetModules();
			await expect(import("~/src/services/auth")).rejects.toMatchObject({
				name: "TalawaRestError",
				message: "API_AUTH_JWT_SECRET must be set in production",
			});
		});
	});

	describe("getAccessTtlSec and getRefreshTtlSec", () => {
		it("getAccessTtlSec returns access TTL in seconds", async () => {
			const { getAccessTtlSec } = await getTokens();
			const ttl = getAccessTtlSec();
			expect(typeof ttl).toBe("number");
			expect(ttl).toBeGreaterThan(0);
			expect(Number.isInteger(ttl)).toBe(true);
		});

		it("getRefreshTtlSec returns refresh TTL in seconds", async () => {
			const { getRefreshTtlSec } = await getTokens();
			const ttl = getRefreshTtlSec();
			expect(typeof ttl).toBe("number");
			expect(ttl).toBeGreaterThan(0);
			expect(Number.isInteger(ttl)).toBe(true);
		});
	});

	describe("TTL env parsing", () => {
		it("uses default TTL when env is invalid or non-positive", async () => {
			process.env.API_ACCESS_TOKEN_TTL = "invalid";
			process.env.API_REFRESH_TOKEN_TTL = "0";
			vi.resetModules();
			const { signAccessToken, signRefreshToken, verifyToken } = await import(
				"~/src/services/auth"
			);
			const accessToken = await signAccessToken({
				id: "u1",
				email: "a@b.co",
			});
			const refreshToken = await signRefreshToken("u1", "jti-1");
			const accessPayload = await verifyToken<AccessClaims>(accessToken);
			const refreshPayload = await verifyToken<RefreshClaims>(refreshToken);
			expect(accessPayload).toMatchObject({ sub: "u1", typ: "access" });
			expect(refreshPayload).toMatchObject({
				sub: "u1",
				typ: "refresh",
				jti: "jti-1",
			});
			// Default TTLs when env is invalid: access 900s, refresh 2592000s (jose adds exp/iat to payload)
			expect(Number(refreshPayload.exp) - Number(refreshPayload.iat)).toBe(
				2592000,
			);
			expect(Number(accessPayload.exp) - Number(accessPayload.iat)).toBe(900);
		});

		it("uses custom TTL when env is valid numeric string", async () => {
			process.env.API_ACCESS_TOKEN_TTL = "60";
			process.env.API_REFRESH_TOKEN_TTL = "3600";
			vi.resetModules();
			const { signAccessToken, signRefreshToken, verifyToken } = await import(
				"~/src/services/auth"
			);
			const accessToken = await signAccessToken({
				id: "u1",
				email: "a@b.co",
			});
			const refreshToken = await signRefreshToken("u1", "jti-1");
			const accessPayload = await verifyToken<AccessClaims>(accessToken);
			const refreshPayload = await verifyToken<RefreshClaims>(refreshToken);
			expect(Number(accessPayload.exp) - Number(accessPayload.iat)).toBe(60);
			expect(Number(refreshPayload.exp) - Number(refreshPayload.iat)).toBe(
				3600,
			);
		});
	});
});
