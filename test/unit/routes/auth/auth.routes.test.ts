import fastifyCookie from "@fastify/cookie";
// validate-error-handling-disable — FakeRedis catch intentionally swallows to mimic pipeline exec
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

class FakeRedisZ {
	private z = new Map<string, Array<{ s: number; m: string }>>();

	pipeline() {
		const self = this;
		const commands: (() => Promise<unknown>)[] = [];
		return {
			zremrangebyscore(
				key: string,
				min: number | string,
				max: number | string,
			) {
				commands.push(() => self.zremrangebyscore(key, min, max));
				return this;
			},
			zcard(key: string) {
				commands.push(() => self.zcard(key));
				return this;
			},
			zadd(key: string, score: number, member: string) {
				commands.push(() => self.zadd(key, score, member));
				return this;
			},
			zrange(
				key: string,
				start: number,
				stop: number,
				withScores?: "WITHSCORES",
			) {
				commands.push(() => self.zrange(key, start, stop, withScores));
				return this;
			},
			expire(key: string, sec: number) {
				commands.push(() => self.expire(key, sec));
				return this;
			},
			async exec() {
				const results = [];
				for (const cmd of commands) {
					try {
						const res = await cmd();
						results.push([null, res]);
					} catch (err) {
						results.push([err, null]);
					}
				}
				return results;
			},
		};
	}

	async zremrangebyscore(
		key: string,
		min: number | string,
		max: number | string,
	) {
		const arr = this.z.get(key) ?? [];
		const lo = min === "-inf" ? -Infinity : Number(min);
		const hi = max === "+inf" ? Infinity : Number(max);
		this.z.set(
			key,
			arr.filter((e) => e.s < lo || e.s > hi),
		);
	}
	async zcard(key: string) {
		return (this.z.get(key) ?? []).length;
	}
	async zadd(key: string, score: number, member: string) {
		const arr = this.z.get(key) ?? [];
		const existingIndex = arr.findIndex((e) => e.m === member);
		if (existingIndex !== -1 && arr[existingIndex]) {
			arr[existingIndex].s = score;
		} else {
			arr.push({ s: score, m: member });
		}
		arr.sort((a, b) => a.s - b.s);
		this.z.set(key, arr);
	}
	async zrange(
		key: string,
		start: number,
		stop: number,
		withScores?: "WITHSCORES",
	) {
		const arr = this.z.get(key) ?? [];
		const slice = arr.slice(start, stop + 1);
		if (withScores === "WITHSCORES") {
			const flat: string[] = [];
			slice.forEach((e) => {
				flat.push(e.m);
				flat.push(String(e.s));
			});
			return flat;
		}
		return slice.map((e) => e.m);
	}
	async expire(_key: string, _sec: number) {
		/* noop */
	}
}

const TEST_COOKIE_SECRET = "test-cookie-secret-at-least-32-characters";
const mockDb = {} as unknown as DrizzleClient;

async function buildTestApp() {
	const app = Fastify({ logger: false });
	app.decorate("drizzleClient", mockDb);
	app.decorate("redis", new FakeRedisZ() as unknown as FastifyRedis);
	app.decorate("envConfig", {} as EnvConfig);
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
		it("returns 200 and sets cookies with user id and email", async () => {
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

			expect(res.statusCode).toBe(200);
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
		expect(signupRes.statusCode).toBe(200);

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
