import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AccessClaims, RefreshClaims } from "~/src/services/auth/tokens";

const FIXED_SECRET = "test-secret-for-unit-tests";

describe("auth/tokens", () => {
	const originalSecret = process.env.AUTH_JWT_SECRET;
	const originalAccessTtl = process.env.ACCESS_TOKEN_TTL;
	const originalRefreshTtl = process.env.REFRESH_TOKEN_TTL;

	beforeEach(() => {
		process.env.AUTH_JWT_SECRET = FIXED_SECRET;
		delete process.env.ACCESS_TOKEN_TTL;
		delete process.env.REFRESH_TOKEN_TTL;
		vi.resetModules();
	});

	afterEach(() => {
		if (originalSecret !== undefined) {
			process.env.AUTH_JWT_SECRET = originalSecret;
		} else {
			delete process.env.AUTH_JWT_SECRET;
		}
		if (originalAccessTtl !== undefined) {
			process.env.ACCESS_TOKEN_TTL = originalAccessTtl;
		} else {
			delete process.env.ACCESS_TOKEN_TTL;
		}
		if (originalRefreshTtl !== undefined) {
			process.env.REFRESH_TOKEN_TTL = originalRefreshTtl;
		} else {
			delete process.env.REFRESH_TOKEN_TTL;
		}
		vi.resetModules();
	});

	async function getTokens() {
		return import("~/src/services/auth/tokens");
	}

	describe("signAccessToken / verifyToken", () => {
		it("signs access token with sub, email, typ, ver and verify returns payload", async () => {
			const { signAccessToken: sign, verifyToken: verify } = await getTokens();
			const user = { id: "user-1", email: "u@example.com" };
			const token = await sign(user);
			expect(token).toBeTruthy();
			expect(typeof token).toBe("string");

			const payload = await verify<AccessClaims>(token);
			expect(payload.sub).toBe(user.id);
			expect(payload.email).toBe(user.email);
			expect(payload.typ).toBe("access");
			expect(payload.ver).toBe(1);
		});
	});

	describe("signRefreshToken / verifyToken", () => {
		it("signs refresh token with sub, typ, ver, jti and verify returns payload", async () => {
			const { signRefreshToken: sign, verifyToken: verify } = await getTokens();
			const userId = "user-1";
			const jti = "refresh-jti-123";
			const token = await sign(userId, jti);
			expect(token).toBeTruthy();

			const payload = await verify<RefreshClaims>(token);
			expect(payload.sub).toBe(userId);
			expect(payload.typ).toBe("refresh");
			expect(payload.ver).toBe(1);
			expect(payload.jti).toBe(jti);
		});
	});

	describe("verifyToken", () => {
		it("decodes valid access token with correct typ", async () => {
			const { signAccessToken: sign, verifyToken: verify } = await getTokens();
			const token = await sign({ id: "u1", email: "a@b.co" });
			const payload = await verify<AccessClaims>(token);
			expect(payload.typ).toBe("access");
			expect(payload.sub).toBe("u1");
			expect(payload.email).toBe("a@b.co");
		});

		it("decodes valid refresh token with correct typ", async () => {
			const { signRefreshToken: sign, verifyToken: verify } = await getTokens();
			const token = await sign("u1", "jti-1");
			const payload = await verify<RefreshClaims>(token);
			expect(payload.typ).toBe("refresh");
			expect(payload.sub).toBe("u1");
			expect(payload.jti).toBe("jti-1");
		});

		it("throws on wrong secret", async () => {
			const { signAccessToken } = await getTokens();
			const token = await signAccessToken({ id: "u1", email: "a@b.co" });
			process.env.AUTH_JWT_SECRET = "different-secret";
			vi.resetModules();
			const { verifyToken } = await getTokens();
			await expect(verifyToken(token)).rejects.toThrow();
		});

		it("throws on expired token", async () => {
			const { SignJWT } = await import("jose");
			const encoder = new TextEncoder();
			const secret = encoder.encode(FIXED_SECRET);
			const expired = await new SignJWT({
				sub: "u1",
				email: "a@b.co",
				typ: "access",
				ver: 1,
			})
				.setProtectedHeader({ alg: "HS256" })
				.setIssuer("talawa-api")
				.setIssuedAt()
				.setExpirationTime("0s")
				.sign(secret);

			const { verifyToken } = await getTokens();
			await expect(verifyToken(expired)).rejects.toThrow();
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
			await expect(verifyToken(wrongIssuer)).rejects.toThrow();
		});

		it("throws on malformed JWT string", async () => {
			const { verifyToken } = await getTokens();
			await expect(verifyToken("")).rejects.toThrow();
			await expect(verifyToken("not-a-valid-jwt")).rejects.toThrow();
		});
	});

	describe("default secret when AUTH_JWT_SECRET unset", () => {
		it("uses default secret and can sign and verify", async () => {
			delete process.env.AUTH_JWT_SECRET;
			vi.resetModules();
			const { signAccessToken, verifyToken } = await import(
				"~/src/services/auth/tokens"
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

	describe("TTL env parsing", () => {
		it("uses default TTL when env is invalid or non-positive", async () => {
			process.env.ACCESS_TOKEN_TTL = "invalid";
			process.env.REFRESH_TOKEN_TTL = "0";
			vi.resetModules();
			const { signAccessToken, signRefreshToken, verifyToken } = await import(
				"~/src/services/auth/tokens"
			);
			const accessToken = await signAccessToken({
				id: "u1",
				email: "a@b.co",
			});
			const refreshToken = await signRefreshToken("u1", "jti-1");
			await expect(
				verifyToken<AccessClaims>(accessToken),
			).resolves.toMatchObject({
				sub: "u1",
				typ: "access",
			});
			await expect(
				verifyToken<RefreshClaims>(refreshToken),
			).resolves.toMatchObject({
				sub: "u1",
				typ: "refresh",
				jti: "jti-1",
			});
		});
	});
});
