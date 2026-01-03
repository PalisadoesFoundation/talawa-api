import Fastify, { type FastifyRequest } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { errorHandlerPlugin } from "~/src/fastifyPlugins/errorHandler";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaRestError } from "~/src/utilities/errors/TalawaRestError";

describe("errorHandlerPlugin", () => {
	let app: ReturnType<typeof Fastify>;
	let errorSpy: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		app = Fastify({
			logger: {
				level: "silent",
			},
		});

		errorSpy = vi.fn();

		// Attach spy to request-scoped logger
		app.addHook("onRequest", async (request: FastifyRequest) => {
			request.id =
				(request.headers["x-correlation-id"] as string) ??
				"generated-correlation-id";

			// Spy on the logger instance attached to the request
			vi.spyOn(request.log, "error").mockImplementation(errorSpy);
		});

		await app.register(errorHandlerPlugin);

		// Define routes for testing
		app.get("/boom", async () => {
			throw new TalawaRestError({
				code: ErrorCode.NOT_FOUND,
				message: "Missing",
				details: { id: "x" },
			});
		});

		app.get("/fail", async () => {
			throw new TalawaRestError({
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				message: "Whoops",
			});
		});

		app.get("/test-400", async () => {
			throw new TalawaRestError({
				code: ErrorCode.INVALID_ARGUMENTS,
				message: "Bad Request",
			});
		});

		app.get("/zod", async () => {
			const { ZodError, ZodIssueCode } = await import("zod");
			throw new ZodError([
				{
					code: ZodIssueCode.invalid_type,
					expected: "string",
					received: "number",
					path: ["body", "title"],
					message: "Expected string, received number",
				},
			]);
		});

		await app.ready();
	});

	afterEach(async () => {
		await app.close();
		vi.restoreAllMocks();
	});

	it("returns unified payload with correlationId for TalawaRestError", async () => {
		const res = await app.inject({ method: "GET", url: "/boom" });
		expect(res.statusCode).toBe(404);
		const body = res.json();
		expect(body.error.code).toBe("not_found");
		expect(body.error.message).toBe("Missing");
		expect(body.error.details).toEqual({ id: "x" });
		expect(body.error.correlationId).toBe("generated-correlation-id");
	});

	it("handles generic errors as 500", async () => {
		const res = await app.inject({ method: "GET", url: "/fail" });
		expect(res.statusCode).toBe(500);
		const body = res.json();
		expect(body.error.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
		// TalawaRestError preserves the original message
		expect(body.error.message).toBe("Whoops");
		expect(body.error.correlationId).toBe("generated-correlation-id");
	});

	it("includes correlationId from header", async () => {
		const res = await app.inject({
			method: "GET",
			url: "/fail",
			headers: {
				"x-correlation-id": "client-provided-id",
			},
		});

		expect(res.json().error.correlationId).toBe("client-provided-id");
	});

	it("logs errors with correlationId and context", async () => {
		await app.inject({
			method: "GET",
			url: "/fail",
			headers: {
				"x-correlation-id": "log-cid",
			},
		});

		expect(errorSpy).toHaveBeenCalledTimes(1);
		expect(errorSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				msg: "Request error",
				correlationId: "log-cid",
				error: expect.objectContaining({
					message: "Whoops",
				}),
			}),
		);
	});

	it("handles Zod validation errors (simulated)", async () => {
		const res = await app.inject({ method: "GET", url: "/zod" });
		expect(res.statusCode).toBe(400);
		const body = res.json();
		expect(body.error.code).toBe(ErrorCode.INVALID_ARGUMENTS);
		expect(body.error.message).toBe("Invalid input");
		expect(body.error.details).toBeDefined();
	});

	it("returns original message for 4xx errors", async () => {
		const res = await app.inject({
			method: "GET",
			url: "/test-400",
		});

		const body = res.json();
		expect(res.statusCode).toBe(400);
		expect(body.error.code).toBe(ErrorCode.INVALID_ARGUMENTS);
	});
});
