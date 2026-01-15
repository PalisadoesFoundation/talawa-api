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

		// Add GraphQL route that throws an error
		app.post("/graphql", async (request: FastifyRequest) => {
			const query = request.query as { errorType?: string };
			if (query?.errorType === "details") {
				throw new TalawaRestError({
					code: ErrorCode.INVALID_ARGUMENTS,
					message: "Invalid args",
					details: { invalidField: "foo" },
				});
			}
			throw new TalawaRestError({
				code: ErrorCode.UNAUTHENTICATED,
				message: "Not authenticated",
			});
		});

		// Add a route that throws a generic error
		app.get("/generic-error", async () => {
			throw new Error("Generic error message");
		});

		// Route for testing GraphQL with generic errors
		app.post("/graphql-generic", async () => {
			throw new Error("Generic GraphQL error");
		});

		// Add route for testing different error types
		app.get("/unauthorized", async () => {
			throw new TalawaRestError({
				code: ErrorCode.UNAUTHENTICATED,
				message: "Access denied",
			});
		});

		app.get("/forbidden", async () => {
			throw new TalawaRestError({
				code: ErrorCode.UNAUTHORIZED,
				message: "Insufficient permissions",
			});
		});

		app.get("/conflict", async () => {
			throw new TalawaRestError({
				code: ErrorCode.CONFLICT,
				message: "Resource conflict",
			});
		});

		app.get("/rate-limit", async () => {
			throw new TalawaRestError({
				code: ErrorCode.RATE_LIMIT_EXCEEDED,
				message: "Rate limit exceeded",
			});
		});

		// Route that throws error without stack trace
		app.get("/no-stack", async () => {
			const error = new Error("No stack error");
			delete error.stack;
			throw error;
		});

		// Route that throws TalawaRestError without details
		app.get("/no-details", async () => {
			throw new TalawaRestError({
				code: ErrorCode.NOT_FOUND,
				message: "Resource not found",
			});
		});

		await app.ready();
	});

	afterEach(async () => {
		await app.close();
		vi.restoreAllMocks();
	});

	describe("Basic Error Handling", () => {
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
			expect(body.error.message).toBe("Whoops");
			expect(body.error.correlationId).toBe("generated-correlation-id");
		});

		it("handles non-TalawaRestError with standardized format", async () => {
			const res = await app.inject({ method: "GET", url: "/generic-error" });
			expect(res.statusCode).toBe(500);
			const body = res.json();
			expect(body.error.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
			expect(body.error.message).toMatch(
				/Generic error message|Internal Server Error/,
			);
			expect(body.error.correlationId).toBe("generated-correlation-id");
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

	describe("HTTP Status Code Mapping", () => {
		it("handles 401 Unauthorized errors", async () => {
			const res = await app.inject({ method: "GET", url: "/unauthorized" });
			expect(res.statusCode).toBe(401);
			const body = res.json();
			expect(body.error.code).toBe(ErrorCode.UNAUTHENTICATED);
			expect(body.error.message).toBe("Access denied");
		});

		it("handles 403 Forbidden errors", async () => {
			const res = await app.inject({ method: "GET", url: "/forbidden" });
			expect(res.statusCode).toBe(403);
			const body = res.json();
			expect(body.error.code).toBe(ErrorCode.UNAUTHORIZED);
			expect(body.error.message).toBe("Insufficient permissions");
		});

		it("handles 409 Conflict errors", async () => {
			const res = await app.inject({ method: "GET", url: "/conflict" });
			expect(res.statusCode).toBe(409);
			const body = res.json();
			expect(body.error.code).toBe(ErrorCode.CONFLICT);
			expect(body.error.message).toBe("Resource conflict");
		});

		it("handles 429 Too Many Requests errors", async () => {
			const res = await app.inject({ method: "GET", url: "/rate-limit" });
			expect(res.statusCode).toBe(429);
			const body = res.json();
			expect(body.error.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
			expect(body.error.message).toBe("Rate limit exceeded");
		});
	});

	describe("GraphQL Error Handling", () => {
		it("handles GraphQL requests with special 200 OK response", async () => {
			const res = await app.inject({
				method: "POST",
				url: "/graphql",
				headers: {
					"content-type": "application/json",
				},
				payload: JSON.stringify({
					query: "{ hello }",
				}),
			});

			expect(res.statusCode).toBe(200);
			const body = res.json();
			expect(body.errors).toBeDefined();
			expect(body.errors[0]).toEqual(
				expect.objectContaining({
					message: "Not authenticated",
					extensions: expect.objectContaining({
						code: "unauthenticated",
						correlationId: "generated-correlation-id",
						httpStatus: 401,
					}),
				}),
			);
			expect(body.data).toBeNull();
		});

		it("handles GraphQL requests with enhanced error formatting", async () => {
			const res = await app.inject({
				method: "POST",
				url: "/graphql",
				headers: {
					"content-type": "application/json",
				},
				payload: JSON.stringify({
					query: "{ nonExistentField }",
				}),
			});

			expect(res.statusCode).toBe(200);
			const body = res.json();
			expect(body.errors).toBeDefined();
			expect(body.errors[0]).toEqual(
				expect.objectContaining({
					extensions: expect.objectContaining({
						correlationId: "generated-correlation-id",
					}),
				}),
			);
			expect(body.data).toBeNull();
		});

		it("handles GraphQL requests with generic errors", async () => {
			const res = await app.inject({
				method: "POST",
				url: "/graphql-generic",
				headers: {
					"content-type": "application/json",
				},
				payload: JSON.stringify({
					query: "{ hello }",
				}),
			});

			expect(res.statusCode).toBe(500);
			const body = res.json();
			expect(body.error.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
			expect(body.error.message).toMatch(
				/Generic GraphQL error|Internal Server Error/,
			);
		});

		it("includes details in GraphQL error response when present", async () => {
			const res = await app.inject({
				method: "POST",
				url: "/graphql?errorType=details",
				headers: {
					"content-type": "application/json",
				},
				payload: JSON.stringify({
					query: "{ hello }",
				}),
			});

			expect(res.statusCode).toBe(200);
			const body = res.json();
			expect(body.errors[0].extensions.code).toBe("invalid_arguments");
			expect(body.errors[0].extensions.details).toEqual({
				invalidField: "foo",
			});
		});
	});

	describe("Correlation ID Handling", () => {
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

		it("generates correlationId when not provided", async () => {
			const res = await app.inject({
				method: "GET",
				url: "/fail",
			});

			expect(res.json().error.correlationId).toBe("generated-correlation-id");
		});
	});

	describe("Logging Behavior", () => {
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

		it("logs errors with null stack when stack is missing", async () => {
			await app.inject({
				method: "GET",
				url: "/no-stack",
			});

			expect(errorSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					error: expect.objectContaining({
						stack: null,
					}),
				}),
			);
		});

		it("logs TalawaRestError details when present", async () => {
			await app.inject({
				method: "GET",
				url: "/boom",
			});

			expect(errorSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					error: expect.objectContaining({
						details: { id: "x" },
					}),
				}),
			);
		});

		it("logs errors without details when not present", async () => {
			await app.inject({
				method: "GET",
				url: "/no-details",
			});

			expect(errorSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					error: expect.objectContaining({
						details: undefined,
					}),
				}),
			);
		});
	});

	describe("Error Response Format", () => {
		it("uses TalawaRestError JSON format for non-GraphQL requests", async () => {
			const res = await app.inject({ method: "GET", url: "/boom" });
			expect(res.statusCode).toBe(404);
			const body = res.json();

			// Should match TalawaRestError.toJSON format
			expect(body).toEqual({
				error: {
					code: "not_found",
					message: "Missing",
					details: { id: "x" },
					correlationId: "generated-correlation-id",
				},
			});
		});

		it("handles TalawaRestError without details", async () => {
			const res = await app.inject({ method: "GET", url: "/no-details" });
			expect(res.statusCode).toBe(404);
			const body = res.json();

			expect(body.error.details).toBeUndefined();
		});

		it("standardizes non-TalawaRestError responses", async () => {
			const res = await app.inject({ method: "GET", url: "/generic-error" });
			expect(res.statusCode).toBe(500);
			const body = res.json();

			expect(body).toEqual({
				error: {
					code: ErrorCode.INTERNAL_SERVER_ERROR,
					message: expect.any(String),
					correlationId: "generated-correlation-id",
					details: null,
				},
			});
		});
	});

	describe("Validation Error Handling", () => {
		it("handles Zod validation errors (simulated)", async () => {
			const res = await app.inject({ method: "GET", url: "/zod" });
			expect(res.statusCode).toBe(400);
			const body = res.json();
			expect(body.error.code).toBe(ErrorCode.INVALID_ARGUMENTS);
			expect(body.error.message).toBe("Invalid input");
			expect(body.error.details).toBeDefined();
		});
	});
});
