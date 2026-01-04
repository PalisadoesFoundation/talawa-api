import Fastify, { type FastifyRequest } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import errorHandlerPlugin from "../../src/fastifyPlugins/errorHandler";

describe("errorHandlerPlugin", () => {
	let app: ReturnType<typeof Fastify>;
	let errorSpy: ReturnType<
		typeof vi.fn<[unknown, string?, ...unknown[]], void>
	>;

	beforeEach(async () => {
		app = Fastify({
			// Fastify v5 requires logger CONFIG, not instance
			logger: {
				level: "info",
			},
		});

		errorSpy = vi.fn<[unknown, string?, ...unknown[]], void>();

		// Attach spy to request-scoped logger
		app.addHook("onRequest", async (request: FastifyRequest) => {
			request.id =
				(request.headers["x-correlation-id"] as string) ??
				"generated-correlation-id";

			vi.spyOn(request.log, "error").mockImplementation(errorSpy);
		});

		await app.register(errorHandlerPlugin);

		app.get("/test-error", async () => {
			throw new Error("Boom");
		});

		app.get("/test-400", async () => {
			const err: Error & { statusCode?: number } = new Error("Bad Request");
			err.statusCode = 400;
			throw err;
		});

		await app.ready();
	});

	afterEach(async () => {
		await app.close();
		vi.restoreAllMocks();
	});

	it("includes correlationId in error response", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/test-error",
			headers: {
				"x-correlation-id": "cid-123",
			},
		});

		const body = response.json();

		expect(response.statusCode).toBe(500);
		expect(body.error.correlationId).toBe("cid-123");
		expect(body.error.message).toBe("Internal Server Error");
	});

	it("uses same correlationId from x-correlation-id header", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/test-error",
			headers: {
				"x-correlation-id": "consistent-id",
			},
		});

		expect(response.json().error.correlationId).toBe("consistent-id");
	});

	it("logs errors with correlationId", async () => {
		await app.inject({
			method: "GET",
			url: "/test-error",
			headers: {
				"x-correlation-id": "log-cid",
			},
		});

		expect(errorSpy).toHaveBeenCalledTimes(1);
		expect(errorSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				correlationId: "log-cid",
				error: expect.any(Error),
			}),
		);
	});

	it("returns original message for 4xx errors", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/test-400",
			headers: {
				"x-correlation-id": "cid-400",
			},
		});

		const body = response.json();

		expect(response.statusCode).toBe(400);
		expect(body.error.message).toBe("Bad Request");
		expect(body.error.correlationId).toBe("cid-400");
	});

	it("works for non-GraphQL REST routes", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/test-error",
		});

		expect(response.statusCode).toBe(500);
		expect(response.json().error).toHaveProperty("correlationId");
	});
});
