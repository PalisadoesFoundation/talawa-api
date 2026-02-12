import fastifyCookie from "@fastify/cookie";
import Fastify from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import authPlugin from "~/src/fastifyPlugins/auth";
import errorHandlerPlugin from "~/src/fastifyPlugins/errorHandler";
import { verifyToken } from "~/src/services/auth/tokens";
import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";

vi.mock("~/src/services/auth/tokens", () => ({
	verifyToken: vi.fn(),
}));

const TEST_COOKIE_SECRET = "test-cookie-secret-at-least-32-chars";

async function buildTestApp() {
	const app = Fastify({ logger: false });
	await app.register(errorHandlerPlugin);
	await app.register(fastifyCookie, { secret: TEST_COOKIE_SECRET });
	await app.register(authPlugin);

	app.get("/me", async (req) => ({ currentUser: req.currentUser }));
	app.get("/protected", { preHandler: app.requireAuth() }, async () => ({
		ok: true,
	}));

	return app;
}

describe("auth plugin", () => {
	beforeEach(() => {
		vi.mocked(verifyToken).mockReset();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("leaves currentUser unset when no token is provided", async () => {
		const app = await buildTestApp();
		const res = await app.inject({ method: "GET", url: "/me" });
		expect(res.statusCode).toBe(200);
		expect(res.json()).toEqual({ currentUser: undefined });
		expect(verifyToken).not.toHaveBeenCalled();
	});

	it("sets currentUser when valid access token is in cookie", async () => {
		vi.mocked(verifyToken).mockResolvedValue({
			sub: "user-1",
			email: "u@b.co",
			typ: "access",
		});
		const app = await buildTestApp();
		const res = await app.inject({
			method: "GET",
			url: "/me",
			cookies: { [COOKIE_NAMES.ACCESS_TOKEN]: "any-token" },
		});
		expect(res.statusCode).toBe(200);
		expect(res.json()).toEqual({
			currentUser: { id: "user-1", email: "u@b.co" },
		});
		expect(verifyToken).toHaveBeenCalledTimes(1);
		expect(verifyToken).toHaveBeenCalledWith("any-token");
	});

	it("sets currentUser when valid access token is in Authorization Bearer header", async () => {
		vi.mocked(verifyToken).mockResolvedValue({
			sub: "user-2",
			email: "bearer@b.co",
			typ: "access",
		});
		const app = await buildTestApp();
		const res = await app.inject({
			method: "GET",
			url: "/me",
			headers: { authorization: "Bearer bearer-token" },
		});
		expect(res.statusCode).toBe(200);
		expect(res.json()).toEqual({
			currentUser: { id: "user-2", email: "bearer@b.co" },
		});
		expect(verifyToken).toHaveBeenCalledWith("bearer-token");
	});

	it("prefers cookie over Bearer when both are present", async () => {
		vi.mocked(verifyToken).mockImplementation(async (token: string) => {
			if (token === "cookie-token") {
				return { sub: "user-from-cookie", email: "c@b.co", typ: "access" };
			}
			return { sub: "user-from-bearer", email: "b@b.co", typ: "access" };
		});
		const app = await buildTestApp();
		const res = await app.inject({
			method: "GET",
			url: "/me",
			cookies: { [COOKIE_NAMES.ACCESS_TOKEN]: "cookie-token" },
			headers: { authorization: "Bearer bearer-token" },
		});
		expect(res.statusCode).toBe(200);
		expect(res.json().currentUser?.id).toBe("user-from-cookie");
		expect(res.json().currentUser?.email).toBe("c@b.co");
		expect(verifyToken).toHaveBeenCalledTimes(1);
		expect(verifyToken).toHaveBeenCalledWith("cookie-token");
	});

	it("leaves currentUser unset when token is invalid or expired", async () => {
		vi.mocked(verifyToken).mockRejectedValue(new Error("invalid"));
		const app = await buildTestApp();
		const res = await app.inject({
			method: "GET",
			url: "/me",
			cookies: { [COOKIE_NAMES.ACCESS_TOKEN]: "bad-token" },
		});
		expect(res.statusCode).toBe(200);
		expect(res.json()).toEqual({ currentUser: undefined });
	});

	it("leaves currentUser unset when token typ is not access", async () => {
		vi.mocked(verifyToken).mockResolvedValue({
			sub: "user-1",
			typ: "refresh",
		});
		const app = await buildTestApp();
		const res = await app.inject({
			method: "GET",
			url: "/me",
			cookies: { [COOKIE_NAMES.ACCESS_TOKEN]: "refresh-token" },
		});
		expect(res.statusCode).toBe(200);
		expect(res.json()).toEqual({ currentUser: undefined });
	});

	it("leaves currentUser unset when access payload has no sub", async () => {
		vi.mocked(verifyToken).mockResolvedValue({
			typ: "access",
			email: "nobody@b.co",
		});
		const app = await buildTestApp();
		const res = await app.inject({
			method: "GET",
			url: "/me",
			cookies: { [COOKIE_NAMES.ACCESS_TOKEN]: "no-sub-token" },
		});
		expect(res.statusCode).toBe(200);
		expect(res.json()).toEqual({ currentUser: undefined });
	});

	it("leaves currentUser unset and does not call verifyToken when token is whitespace-only", async () => {
		const app = await buildTestApp();
		const res = await app.inject({
			method: "GET",
			url: "/me",
			cookies: { [COOKIE_NAMES.ACCESS_TOKEN]: "   \t " },
		});
		expect(res.statusCode).toBe(200);
		expect(res.json()).toEqual({ currentUser: undefined });
		expect(verifyToken).not.toHaveBeenCalled();
	});

	it("requireAuth returns 401 when currentUser is not set", async () => {
		const app = await buildTestApp();
		const res = await app.inject({ method: "GET", url: "/protected" });
		expect(res.statusCode).toBe(401);
		const body = res.json();
		expect(body.error).toBeDefined();
		expect(body.error.code).toBe(ErrorCode.UNAUTHENTICATED);
		expect(body.error.message).toBe("Authentication required");
	});

	it("requireAuth proceeds when currentUser is set", async () => {
		vi.mocked(verifyToken).mockResolvedValue({
			sub: "user-1",
			email: "u@b.co",
			typ: "access",
		});
		const app = await buildTestApp();
		const res = await app.inject({
			method: "GET",
			url: "/protected",
			cookies: { [COOKIE_NAMES.ACCESS_TOKEN]: "valid-token" },
		});
		expect(res.statusCode).toBe(200);
		expect(res.json()).toEqual({ ok: true });
	});
});
