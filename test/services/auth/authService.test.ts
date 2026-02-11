import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { DrizzleClient } from "~/src/fastifyPlugins/drizzleClient";
import type { CookieConfigOptions } from "~/src/utilities/cookieConfig";
import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";

const mockHashPassword = vi.fn();
const mockVerifyPassword = vi.fn();
const mockSignAccessToken = vi.fn();
const mockSignRefreshToken = vi.fn();
const mockVerifyToken = vi.fn();
const mockPersistRefreshToken = vi.fn();
const mockRevokeRefreshToken = vi.fn();
const mockIsRefreshTokenValid = vi.fn();
const mockGetAccessTtlSec = vi.fn();
const mockGetRefreshTtlSec = vi.fn();

vi.mock("~/src/services/auth/password", () => ({
	hashPassword: (plain: string) => mockHashPassword(plain),
	verifyPassword: (hash: string, plain: string) =>
		mockVerifyPassword(hash, plain),
}));

vi.mock("~/src/services/auth/tokens", () => ({
	getAccessTtlSec: () => mockGetAccessTtlSec(),
	getRefreshTtlSec: () => mockGetRefreshTtlSec(),
	signAccessToken: (user: { id: string; email: string }) =>
		mockSignAccessToken(user),
	signRefreshToken: (userId: string, jti: string) =>
		mockSignRefreshToken(userId, jti),
	verifyToken: (token: string) => mockVerifyToken(token),
}));

vi.mock("~/src/services/auth/refreshStore", () => ({
	isRefreshTokenValid: (db: unknown, token: string, userId: string) =>
		mockIsRefreshTokenValid(db, token, userId),
	persistRefreshToken: (db: unknown, params: unknown) =>
		mockPersistRefreshToken(db, params),
	revokeRefreshToken: (db: unknown, token: string) =>
		mockRevokeRefreshToken(db, token),
}));

const createMockDb = () => {
	const findFirst = vi.fn();
	const insertValuesReturning = vi.fn();
	const insert = vi.fn().mockReturnValue({
		values: vi.fn().mockReturnValue({
			returning: vi.fn().mockImplementation(() => insertValuesReturning()),
		}),
	});
	return {
		insert,
		insertValuesReturning,
		query: {
			usersTable: {
				findFirst,
			},
		},
	};
};

const TEST_COOKIE_OPTIONS: CookieConfigOptions = {
	domain: "test.example.com",
	isSecure: true,
	path: "/",
};

describe("authService", () => {
	const log = {
		child: vi.fn(function child(this: typeof log) {
			return this;
		}),
		debug: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		fatal: vi.fn(),
		trace: vi.fn(),
		silent: vi.fn(),
		level: "info",
	} as unknown as import("fastify").FastifyBaseLogger;

	beforeEach(() => {
		vi.clearAllMocks();
		mockGetAccessTtlSec.mockReturnValue(900);
		mockGetRefreshTtlSec.mockReturnValue(2592000);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("signUp", () => {
		it("returns user on success and calls hashPassword and insert with correct fields", async () => {
			const { signUp } = await import("~/src/services/auth/authService");
			const mockDb = createMockDb();
			mockDb.query.usersTable.findFirst.mockResolvedValue(undefined);
			const createdUser = {
				id: "user-id-1",
				emailAddress: "a@b.co",
				name: "A B",
				passwordHash: "hashed",
				isEmailAddressVerified: false,
				role: "regular",
			} as const;
			mockDb.insertValuesReturning.mockResolvedValue([createdUser]);
			mockHashPassword.mockResolvedValue("hashed");

			const result = await signUp(mockDb as unknown as DrizzleClient, log, {
				email: "a@b.co",
				password: "pwd12345",
				firstName: "A",
				lastName: "B",
			});

			expect(result).toHaveProperty("user");
			expect(result).not.toHaveProperty("error");
			if ("user" in result) {
				expect(result.user.emailAddress).toBe("a@b.co");
				expect(result.user.name).toContain("A");
				expect(result.user.name).toContain("B");
			}
			expect(mockHashPassword).toHaveBeenCalledWith("pwd12345");
			expect(mockDb.insert).toHaveBeenCalledTimes(1);
			const valuesCall =
				mockDb.insert.mock.results[0]?.value?.values?.mock?.calls?.[0]?.[0];
			expect(valuesCall).toBeDefined();
			expect(valuesCall).toMatchObject({
				emailAddress: "a@b.co",
				name: "A B",
				isEmailAddressVerified: false,
				role: "regular",
			});
		});

		it("uses email as name when firstName and lastName are empty", async () => {
			const { signUp } = await import("~/src/services/auth/authService");
			const mockDb = createMockDb();
			mockDb.query.usersTable.findFirst.mockResolvedValue(undefined);
			const createdUser = {
				id: "user-id-2",
				emailAddress: "only@email.co",
				name: "only@email.co",
				passwordHash: "hashed",
				isEmailAddressVerified: false,
				role: "regular",
			} as const;
			mockDb.insertValuesReturning.mockResolvedValue([createdUser]);
			mockHashPassword.mockResolvedValue("hashed");

			const result = await signUp(mockDb as unknown as DrizzleClient, log, {
				email: "only@email.co",
				password: "pwd",
				firstName: "",
				lastName: "",
			});

			expect(result).toHaveProperty("user");
			if ("user" in result) {
				expect(result.user.name).toBe("only@email.co");
			}
			const valuesCall =
				mockDb.insert.mock.results[0]?.value?.values?.mock?.calls?.[0]?.[0];
			expect(valuesCall).toMatchObject({ name: "only@email.co" });
		});

		it("returns already_exists when user with email exists and does not call insert", async () => {
			const { signUp } = await import("~/src/services/auth/authService");
			const mockDb = createMockDb();
			mockDb.query.usersTable.findFirst.mockResolvedValue({
				id: "existing",
				emailAddress: "a@b.co",
			});

			const result = await signUp(mockDb as unknown as DrizzleClient, log, {
				email: "a@b.co",
				password: "pwd",
				firstName: "A",
				lastName: "B",
			});

			expect(result).toEqual({ error: "already_exists" });
			expect(mockDb.insert).not.toHaveBeenCalled();
		});
	});

	describe("signIn", () => {
		it("returns user, access, refresh on success and calls persistRefreshToken with correct params", async () => {
			const { signIn } = await import("~/src/services/auth/authService");
			const mockDb = createMockDb();
			const user = {
				id: "user-1",
				emailAddress: "a@b.co",
				passwordHash: "stored-hash",
			};
			mockDb.query.usersTable.findFirst.mockResolvedValue(user);
			mockVerifyPassword.mockResolvedValue(true);
			mockSignAccessToken.mockResolvedValue("access-jwt");
			mockSignRefreshToken.mockResolvedValue("refresh-jwt");
			mockPersistRefreshToken.mockResolvedValue(undefined);

			const result = await signIn(mockDb as unknown as DrizzleClient, log, {
				email: "a@b.co",
				password: "pwd",
			});

			expect(result).toHaveProperty("user");
			expect(result).toHaveProperty("access", "access-jwt");
			expect(result).toHaveProperty("refresh", "refresh-jwt");
			if ("user" in result) {
				expect(result.user.id).toBe("user-1");
			}
			expect(mockPersistRefreshToken).toHaveBeenCalledTimes(1);
			expect(mockPersistRefreshToken).toHaveBeenCalledWith(
				mockDb,
				expect.objectContaining({
					userId: "user-1",
					token: "refresh-jwt",
					ttlSec: 2592000,
				}),
			);
		});

		it("returns invalid_credentials when no user found", async () => {
			const { signIn } = await import("~/src/services/auth/authService");
			const mockDb = createMockDb();
			mockDb.query.usersTable.findFirst.mockResolvedValue(undefined);

			const result = await signIn(mockDb as unknown as DrizzleClient, log, {
				email: "a@b.co",
				password: "pwd",
			});

			expect(result).toEqual({ error: "invalid_credentials" });
			expect(mockVerifyPassword).not.toHaveBeenCalled();
		});

		it("returns invalid_credentials when password is wrong", async () => {
			const { signIn } = await import("~/src/services/auth/authService");
			const mockDb = createMockDb();
			mockDb.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				emailAddress: "a@b.co",
				passwordHash: "stored-hash",
			});
			mockVerifyPassword.mockResolvedValue(false);

			const result = await signIn(mockDb as unknown as DrizzleClient, log, {
				email: "a@b.co",
				password: "wrong",
			});

			expect(result).toEqual({ error: "invalid_credentials" });
			expect(mockPersistRefreshToken).not.toHaveBeenCalled();
		});
	});

	describe("rotateRefresh", () => {
		it("returns access, refresh, userId on success and revokes old token and persists new", async () => {
			const { rotateRefresh } = await import("~/src/services/auth/authService");
			const mockDb = createMockDb();
			mockVerifyToken.mockResolvedValue({
				sub: "user-1",
				typ: "refresh",
				jti: "old-jti",
			});
			mockIsRefreshTokenValid.mockResolvedValue(true);
			mockRevokeRefreshToken.mockResolvedValue(true);
			mockDb.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				emailAddress: "u@example.com",
			});
			mockSignAccessToken.mockResolvedValue("new-access");
			mockSignRefreshToken.mockResolvedValue("new-refresh");
			mockPersistRefreshToken.mockResolvedValue(undefined);

			const result = await rotateRefresh(
				mockDb as unknown as DrizzleClient,
				log,
				"refreshJwt",
			);

			expect(result).toHaveProperty("access", "new-access");
			expect(result).toHaveProperty("refresh", "new-refresh");
			expect(result).toHaveProperty("userId", "user-1");
			expect(mockRevokeRefreshToken).toHaveBeenCalledWith(mockDb, "refreshJwt");
			expect(mockPersistRefreshToken).toHaveBeenCalledWith(
				mockDb,
				expect.objectContaining({
					userId: "user-1",
					ttlSec: 2592000,
				}),
			);
		});

		it("returns invalid_refresh when token has wrong typ", async () => {
			const { rotateRefresh } = await import("~/src/services/auth/authService");
			const mockDb = createMockDb();
			mockVerifyToken.mockResolvedValue({ sub: "user-1", typ: "access" });

			const result = await rotateRefresh(
				mockDb as unknown as DrizzleClient,
				log,
				"token",
			);

			expect(result).toEqual({ error: "invalid_refresh" });
			expect(mockIsRefreshTokenValid).not.toHaveBeenCalled();
			expect(mockRevokeRefreshToken).not.toHaveBeenCalled();
		});

		it("returns invalid_refresh when verifyToken throws", async () => {
			const { rotateRefresh } = await import("~/src/services/auth/authService");
			const mockDb = createMockDb();
			mockVerifyToken.mockRejectedValue(new Error("expired"));

			const result = await rotateRefresh(
				mockDb as unknown as DrizzleClient,
				log,
				"bad-token",
			);

			expect(result).toEqual({ error: "invalid_refresh" });
			expect(mockIsRefreshTokenValid).not.toHaveBeenCalled();
			expect(mockRevokeRefreshToken).not.toHaveBeenCalled();
		});

		it("returns invalid_refresh when token is empty string", async () => {
			const { rotateRefresh } = await import("~/src/services/auth/authService");
			const mockDb = createMockDb();

			const result = await rotateRefresh(
				mockDb as unknown as DrizzleClient,
				log,
				"",
			);

			expect(result).toEqual({ error: "invalid_refresh" });
			expect(mockVerifyToken).not.toHaveBeenCalled();
		});

		it("returns invalid_refresh when token not valid in DB and does not call revoke or persist", async () => {
			const { rotateRefresh } = await import("~/src/services/auth/authService");
			const mockDb = createMockDb();
			mockVerifyToken.mockResolvedValue({
				sub: "user-1",
				typ: "refresh",
				jti: "jti",
			});
			mockIsRefreshTokenValid.mockResolvedValue(false);

			const result = await rotateRefresh(
				mockDb as unknown as DrizzleClient,
				log,
				"refreshJwt",
			);

			expect(result).toEqual({ error: "invalid_refresh" });
			expect(mockRevokeRefreshToken).not.toHaveBeenCalled();
			expect(mockPersistRefreshToken).not.toHaveBeenCalled();
		});
	});

	describe("setAuthCookies and clearAuthCookies", () => {
		it("setAuthCookies calls setCookie only for provided tokens", async () => {
			const { setAuthCookies } = await import(
				"~/src/services/auth/authService"
			);
			const setCookie = vi.fn();
			const reply = { setCookie } as unknown as Parameters<
				typeof setAuthCookies
			>[0];

			setAuthCookies(reply, { access: "at-only" }, TEST_COOKIE_OPTIONS);

			expect(setCookie).toHaveBeenCalledTimes(1);
			expect(setCookie).toHaveBeenCalledWith(
				COOKIE_NAMES.ACCESS_TOKEN,
				"at-only",
				expect.any(Object),
			);
		});

		it("setAuthCookies calls setCookie with COOKIE_NAMES and options", async () => {
			const { setAuthCookies } = await import(
				"~/src/services/auth/authService"
			);
			const setCookie = vi.fn();
			const reply = { setCookie } as unknown as Parameters<
				typeof setAuthCookies
			>[0];

			setAuthCookies(
				reply,
				{ access: "at", refresh: "rt" },
				TEST_COOKIE_OPTIONS,
			);

			expect(setCookie).toHaveBeenCalledTimes(2);
			expect(setCookie).toHaveBeenCalledWith(
				COOKIE_NAMES.ACCESS_TOKEN,
				"at",
				expect.objectContaining({
					httpOnly: true,
					secure: true,
					path: "/",
					domain: "test.example.com",
					maxAge: 900,
				}),
			);
			expect(setCookie).toHaveBeenCalledWith(
				COOKIE_NAMES.REFRESH_TOKEN,
				"rt",
				expect.objectContaining({
					httpOnly: true,
					secure: true,
					path: "/",
					domain: "test.example.com",
					maxAge: 2592000,
				}),
			);
		});

		it("clearAuthCookies calls clearCookie with both cookie names and same path/domain", async () => {
			const { clearAuthCookies } = await import(
				"~/src/services/auth/authService"
			);
			const clearCookie = vi.fn();
			const reply = { clearCookie } as unknown as Parameters<
				typeof clearAuthCookies
			>[0];

			clearAuthCookies(reply, TEST_COOKIE_OPTIONS);

			expect(clearCookie).toHaveBeenCalledTimes(2);
			expect(clearCookie).toHaveBeenCalledWith(
				COOKIE_NAMES.ACCESS_TOKEN,
				expect.objectContaining({
					path: "/",
					domain: "test.example.com",
					maxAge: 0,
				}),
			);
			expect(clearCookie).toHaveBeenCalledWith(
				COOKIE_NAMES.REFRESH_TOKEN,
				expect.objectContaining({
					path: "/",
					domain: "test.example.com",
					maxAge: 0,
				}),
			);
		});
	});
});
