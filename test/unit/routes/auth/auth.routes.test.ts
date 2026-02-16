import fastifyCookie from "@fastify/cookie";
import type { FastifyRedis } from "@fastify/redis";
import Fastify from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { EnvConfig } from "~/src/envConfigSchema";
import authPlugin from "~/src/fastifyPlugins/auth";
import type { DrizzleClient } from "~/src/fastifyPlugins/drizzleClient";
import errorHandlerPlugin from "~/src/fastifyPlugins/errorHandler";
import rateLimitPlugin from "~/src/fastifyPlugins/rateLimit";
import authRoutes from "~/src/routes/auth";
import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { FakeRedisZ } from "../../../helpers/FakeRedisZ";

const [mockSignUp, mockSignIn, mockRotateRefresh, mockRevokeRefreshToken] =
	vi.hoisted(() => [vi.fn(), vi.fn(), vi.fn(), vi.fn()]);

vi.mock("~/src/services/auth", async (importOriginal) => {
	const actual = await importOriginal<typeof import("~/src/services/auth")>();
	return {
		...actual,
		signUp: mockSignUp,
		signIn: mockSignIn,
		rotateRefresh: mockRotateRefresh,
		revokeRefreshToken: mockRevokeRefreshToken,
	};
});

const TEST_COOKIE_SECRET = "test-cookie-secret-at-least-32-characters";
const mockDb = {} as unknown as DrizzleClient;

type BuildTestAppOptions = {
	envConfig?: Partial<EnvConfig>;
};

async function buildTestApp(options: BuildTestAppOptions = {}) {
	const app = Fastify({ logger: false });
	app.decorate("drizzleClient", mockDb);
	app.decorate("redis", new FakeRedisZ() as unknown as FastifyRedis);
	app.decorate("envConfig", { ...options.envConfig } as EnvConfig);
	await app.register(fastifyCookie, { secret: TEST_COOKIE_SECRET });
	await app.register(errorHandlerPlugin);
	await app.register(rateLimitPlugin);
	await app.register(authPlugin);
	await app.register(authRoutes);
	return app;
}

const validSignUpPayload = {
	email: "a@b.co",
	password: "P@ssword1!",
	firstName: "A",
	lastName: "B",
};

const mockUser = {
	id: "user-id-1",
	emailAddress: "a@b.co",
	name: "A B",
	passwordHash: "hashed",
	isEmailAddressVerified: false,
	role: "regular" as const,
};

describe("auth REST routes", () => {
	let app: Awaited<ReturnType<typeof buildTestApp>>;

	beforeEach(async () => {
		vi.clearAllMocks();
		app = await buildTestApp();
	});

	afterEach(async () => {
		if (app) await app.close();
		vi.restoreAllMocks();
	});

	describe("POST /auth/signup", () => {
		it("returns 201 and sets cookies with user id and email", async () => {
			mockSignUp.mockResolvedValue({ user: mockUser });
			mockSignIn.mockResolvedValue({
				user: mockUser,
				access: "access-token",
				refresh: "refresh-token",
			});

			const res = await app.inject({
				method: "POST",
				url: "/auth/signup",
				payload: validSignUpPayload,
			});

			expect(res.statusCode).toBe(201);
			const body = res.json();
			expect(body.user).toBeDefined();
			expect(body.user.id).toBe(mockUser.id);
			expect(body.user.email).toBe(mockUser.emailAddress);
			const cookies = res.cookies;
			expect(cookies.some((c) => c.name === COOKIE_NAMES.ACCESS_TOKEN)).toBe(
				true,
			);
			expect(cookies.some((c) => c.name === COOKIE_NAMES.REFRESH_TOKEN)).toBe(
				true,
			);
		});

		it("returns 409 when email already registered", async () => {
			mockSignUp.mockResolvedValue({ error: "already_exists" });

			const res = await app.inject({
				method: "POST",
				url: "/auth/signup",
				payload: validSignUpPayload,
			});

			expect(res.statusCode).toBe(409);
			expect(res.json().error.code).toBe(ErrorCode.ALREADY_EXISTS);
			expect(res.json().error.message).toBe("Email already registered");
			expect(mockSignIn).not.toHaveBeenCalled();
		});

		it("returns 500 when signIn fails after signup (e.g. persist failure)", async () => {
			mockSignUp.mockResolvedValue({ user: mockUser });
			mockSignIn.mockResolvedValue({ error: "invalid_credentials" });

			const res = await app.inject({
				method: "POST",
				url: "/auth/signup",
				payload: validSignUpPayload,
			});

			expect(res.statusCode).toBe(500);
			expect(res.json().error.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
			expect(res.json().error.message).toBe("Failed to sign in after signup");
		});

		it("returns 400 for invalid body (validation)", async () => {
			const res = await app.inject({
				method: "POST",
				url: "/auth/signup",
				payload: {
					email: "not-an-email",
					password: "short",
					firstName: "",
					lastName: "B",
				},
			});

			expect(res.statusCode).toBe(400);
			expect(res.json().error.code).toBe(ErrorCode.INVALID_ARGUMENTS);
		});

		it("returns 500 when signUp throws an unexpected exception", async () => {
			mockSignUp.mockRejectedValue(new Error("database connection lost"));

			const res = await app.inject({
				method: "POST",
				url: "/auth/signup",
				payload: validSignUpPayload,
			});

			expect(res.statusCode).toBe(500);
		});

		it("sets secure cookies when envConfig.API_IS_SECURE_COOKIES is default (true)", async () => {
			mockSignUp.mockResolvedValue({ user: mockUser });
			mockSignIn.mockResolvedValue({
				user: mockUser,
				access: "access-token",
				refresh: "refresh-token",
			});
			const res = await app.inject({
				method: "POST",
				url: "/auth/signup",
				payload: validSignUpPayload,
			});
			expect(res.statusCode).toBe(201);
			const accessCookie = res.cookies.find(
				(c) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
			);
			const refreshCookie = res.cookies.find(
				(c) => c.name === COOKIE_NAMES.REFRESH_TOKEN,
			);
			expect(accessCookie?.secure).toBe(true);
			expect(refreshCookie?.secure).toBe(true);
		});

		it("sets non-secure cookies when envConfig.API_IS_SECURE_COOKIES is false", async () => {
			const appInsecure = await buildTestApp({
				envConfig: { API_IS_SECURE_COOKIES: false },
			});
			mockSignUp.mockResolvedValue({ user: mockUser });
			mockSignIn.mockResolvedValue({
				user: mockUser,
				access: "access-token",
				refresh: "refresh-token",
			});
			let res: Awaited<ReturnType<typeof appInsecure.inject>>;
			try {
				res = await appInsecure.inject({
					method: "POST",
					url: "/auth/signup",
					payload: validSignUpPayload,
				});
				expect(res.statusCode).toBe(201);
				const accessCookie = res.cookies.find(
					(c) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
				);
				const refreshCookie = res.cookies.find(
					(c) => c.name === COOKIE_NAMES.REFRESH_TOKEN,
				);
				// When API_IS_SECURE_COOKIES is false, secure may be false or omitted
				expect(accessCookie?.secure).not.toBe(true);
				expect(refreshCookie?.secure).not.toBe(true);
			} finally {
				await appInsecure.close();
			}
		});
	});

	describe("POST /auth/signin", () => {
		it("returns 200 and sets cookies for valid credentials", async () => {
			mockSignIn.mockResolvedValue({
				user: mockUser,
				access: "access-token",
				refresh: "refresh-token",
			});

			const res = await app.inject({
				method: "POST",
				url: "/auth/signin",
				payload: { email: "a@b.co", password: "P@ssword1!" },
			});

			expect(res.statusCode).toBe(200);
			expect(res.json().user).toEqual({
				id: mockUser.id,
				email: mockUser.emailAddress,
			});
			expect(
				res.cookies.some((c) => c.name === COOKIE_NAMES.ACCESS_TOKEN),
			).toBe(true);
			expect(
				res.cookies.some((c) => c.name === COOKIE_NAMES.REFRESH_TOKEN),
			).toBe(true);
		});

		it("returns 401 for invalid credentials", async () => {
			mockSignIn.mockResolvedValue({ error: "invalid_credentials" });

			const res = await app.inject({
				method: "POST",
				url: "/auth/signin",
				payload: { email: "a@b.co", password: "wrong" },
			});

			expect(res.statusCode).toBe(401);
			expect(res.json().error.code).toBe(ErrorCode.UNAUTHENTICATED);
			expect(res.json().error.message).toBe("Invalid credentials");
		});

		it("returns 500 when signIn throws an unexpected exception", async () => {
			mockSignIn.mockRejectedValue(new Error("database unavailable"));

			const res = await app.inject({
				method: "POST",
				url: "/auth/signin",
				payload: { email: "a@b.co", password: "P@ssword1!" },
			});

			expect(res.statusCode).toBe(500);
		});
	});

	describe("POST /auth/refresh", () => {
		it("returns 200 and new cookies when refresh token in body", async () => {
			mockRotateRefresh.mockResolvedValue({
				access: "new-access",
				refresh: "new-refresh",
				userId: mockUser.id,
			});

			const res = await app.inject({
				method: "POST",
				url: "/auth/refresh",
				payload: { refreshToken: "valid-refresh-token" },
			});

			expect(res.statusCode).toBe(200);
			expect(res.json()).toEqual({ ok: true });
			const accessCookie = res.cookies.find(
				(c) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
			);
			const refreshCookie = res.cookies.find(
				(c) => c.name === COOKIE_NAMES.REFRESH_TOKEN,
			);
			expect(accessCookie?.value).toBe("new-access");
			expect(refreshCookie?.value).toBe("new-refresh");
		});

		it("returns 200 when refresh token in cookie", async () => {
			mockRotateRefresh.mockResolvedValue({
				access: "new-access",
				refresh: "new-refresh",
				userId: mockUser.id,
			});

			const res = await app.inject({
				method: "POST",
				url: "/auth/refresh",
				payload: {},
				cookies: { [COOKIE_NAMES.REFRESH_TOKEN]: "cookie-refresh-token" },
			});

			expect(res.statusCode).toBe(200);
			expect(mockRotateRefresh).toHaveBeenCalledWith(
				mockDb,
				expect.anything(),
				"cookie-refresh-token",
			);
		});

		it("returns 401 when refresh token missing", async () => {
			const res = await app.inject({
				method: "POST",
				url: "/auth/refresh",
				payload: {},
			});

			expect(res.statusCode).toBe(401);
			expect(res.json().error.code).toBe(ErrorCode.UNAUTHENTICATED);
			expect(res.json().error.message).toBe("Missing refresh token");
			expect(mockRotateRefresh).not.toHaveBeenCalled();
		});

		it("returns 400 when refresh token in body is empty string (validation)", async () => {
			const res = await app.inject({
				method: "POST",
				url: "/auth/refresh",
				payload: { refreshToken: "" },
			});

			expect(res.statusCode).toBe(400);
			expect(res.json().error.code).toBe(ErrorCode.INVALID_ARGUMENTS);
			expect(mockRotateRefresh).not.toHaveBeenCalled();
		});

		it("returns 401 when refresh token invalid", async () => {
			mockRotateRefresh.mockResolvedValue({ error: "invalid_refresh" });

			const res = await app.inject({
				method: "POST",
				url: "/auth/refresh",
				payload: { refreshToken: "invalid-token" },
			});

			expect(res.statusCode).toBe(401);
			expect(res.json().error.code).toBe(ErrorCode.UNAUTHENTICATED);
			expect(res.json().error.message).toBe("Invalid refresh token");
		});

		it("returns 500 when rotateRefresh throws an unexpected exception", async () => {
			mockRotateRefresh.mockRejectedValue(new Error("db unavailable"));

			const res = await app.inject({
				method: "POST",
				url: "/auth/refresh",
				payload: { refreshToken: "some-token" },
			});

			expect(res.statusCode).toBe(500);
		});
	});

	describe("POST /auth/logout", () => {
		it("returns 200 and clears cookies", async () => {
			mockRevokeRefreshToken.mockResolvedValue(undefined);

			const res = await app.inject({
				method: "POST",
				url: "/auth/logout",
				cookies: { [COOKIE_NAMES.REFRESH_TOKEN]: "rt-to-revoke" },
			});

			expect(res.statusCode).toBe(200);
			expect(res.json()).toEqual({ ok: true });
			expect(mockRevokeRefreshToken).toHaveBeenCalledWith(
				mockDb,
				"rt-to-revoke",
			);
			const clearCookies = res.cookies.filter(
				(c) => c.maxAge === 0 || String(c.maxAge) === "0",
			);
			expect(
				clearCookies.some((c) => c.name === COOKIE_NAMES.ACCESS_TOKEN),
			).toBe(true);
			expect(
				clearCookies.some((c) => c.name === COOKIE_NAMES.REFRESH_TOKEN),
			).toBe(true);
		});

		it("returns 200 when no refresh cookie (no-op revoke)", async () => {
			const res = await app.inject({
				method: "POST",
				url: "/auth/logout",
			});

			expect(res.statusCode).toBe(200);
			expect(res.json()).toEqual({ ok: true });
			expect(mockRevokeRefreshToken).not.toHaveBeenCalled();
		});

		it("returns 200 and clears cookies even when revokeRefreshToken throws", async () => {
			mockRevokeRefreshToken.mockRejectedValue(new Error("db unavailable"));

			const res = await app.inject({
				method: "POST",
				url: "/auth/logout",
				cookies: { [COOKIE_NAMES.REFRESH_TOKEN]: "rt-to-revoke" },
			});

			expect(res.statusCode).toBe(200);
			expect(res.json()).toEqual({ ok: true });
			const clearCookies = res.cookies.filter(
				(c) => c.maxAge === 0 || String(c.maxAge) === "0",
			);
			expect(
				clearCookies.some((c) => c.name === COOKIE_NAMES.ACCESS_TOKEN),
			).toBe(true);
			expect(
				clearCookies.some((c) => c.name === COOKIE_NAMES.REFRESH_TOKEN),
			).toBe(true);
		});
	});

	it("full flow: signup → refresh → logout returns 200 at each step", async () => {
		mockSignUp.mockResolvedValue({ user: mockUser });
		mockSignIn.mockResolvedValue({
			user: mockUser,
			access: "access-1",
			refresh: "refresh-1",
		});
		mockRotateRefresh.mockResolvedValue({
			access: "access-3",
			refresh: "refresh-3",
			userId: mockUser.id,
		});
		mockRevokeRefreshToken.mockResolvedValue(undefined);

		const signupRes = await app.inject({
			method: "POST",
			url: "/auth/signup",
			payload: validSignUpPayload,
		});
		expect(signupRes.statusCode).toBe(201);

		const cookies = Object.fromEntries(
			signupRes.cookies.map((c) => [c.name, c.value]),
		);

		const refreshRes = await app.inject({
			method: "POST",
			url: "/auth/refresh",
			cookies,
		});
		expect(refreshRes.statusCode).toBe(200);

		const logoutRes = await app.inject({
			method: "POST",
			url: "/auth/logout",
			cookies: Object.fromEntries(
				refreshRes.cookies.map((c) => [c.name, c.value]),
			),
		});
		expect(logoutRes.statusCode).toBe(200);
	});
});
