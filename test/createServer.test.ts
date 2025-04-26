import type { FastifyInstance } from "fastify";
import { type Mock, beforeEach, expect, test, vi } from "vitest";
import { createServer } from "~/src/createServer";
import { auth } from "~/src/lib/auth";

vi.mock("~/src/lib/auth", () => ({
	auth: {
		handler: vi.fn(),
	},
}));

vi.mock("~/src/lib/db", async () => {
	const actual =
		await vi.importActual<typeof import("~/src/lib/db")>("~/src/lib/db");
	return {
		...actual,
		db: {
			select: vi.fn(() => ({
				from: () => ({
					where: () => [
						{
							role: "admin",
							countryCode: "IN",
							avatarName: "avatar123",
						},
					],
				}),
			})),
		},
	};
});

let server: FastifyInstance;

beforeEach(async () => {
	(auth.handler as Mock).mockReset();
	server = await createServer();
});

test("should handle valid requests and return the expected response", async () => {
	(auth.handler as Mock).mockResolvedValueOnce(
		new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { "content-type": "application/json" },
		}),
	);

	const response = await server.inject({
		method: "POST",
		url: "/api/auth/sign-in/email",
		headers: { "content-type": "application/json" },
		payload: { email: "test@gmail.com", password: "test" },
	});

	expect(response.statusCode).toBe(200);
	expect(response.json()).toEqual({ success: true });
	expect(auth.handler).toHaveBeenCalled();
});

test("should handle requests with missing headers gracefully", async () => {
	(auth.handler as Mock).mockResolvedValueOnce(
		new Response(JSON.stringify({ success: false }), {
			status: 400,
			headers: { "content-type": "application/json" },
		}),
	);

	const response = await server.inject({
		method: "POST",
		url: "/api/auth/sign-in/email",
		payload: { email: "test@gmail.com", password: "test" },
	});

	expect(response.statusCode).toBe(400);
	expect(response.json()).toEqual({ success: false });
	expect(auth.handler).toHaveBeenCalled();
});

test("should handle errors from auth.handler and return 500", async () => {
	(auth.handler as Mock).mockRejectedValueOnce(
		new Error("Auth service failed"),
	);

	const response = await server.inject({
		method: "POST",
		url: "/api/auth/sign-in/email",
		headers: { "content-type": "application/json" },
		payload: { email: "test@gmail.com", password: "test" },
	});

	expect(response.statusCode).toBe(500);
	expect(response.json()).toEqual({
		statusCode: "10001",
		message: "Authentication service error",
		error: "Internal server error",
	});
	expect(auth.handler).toHaveBeenCalled();
});

test("should forward headers and body correctly to auth.handler", async () => {
	(auth.handler as Mock).mockResolvedValueOnce(
		new Response(null, { status: 204 }),
	);
	const response = await server.inject({
		method: "POST",
		url: "/api/auth/update",
		headers: { "x-custom-header": "value" },
		payload: { data: "some data" },
	});

	expect(response.statusCode).toBe(204);
	expect((auth.handler as Mock).mock.calls.length).toBeGreaterThan(0);

	const req = (auth.handler as Mock).mock.calls[0]?.[0] as Request;
	expect(req.method).toBe("POST");

	const contentType = req.headers.get("content-type");
	expect(contentType).toContain("application/json");

	const body = await req.text();
	expect(body).toBe(JSON.stringify({ data: "some data" }));
});
