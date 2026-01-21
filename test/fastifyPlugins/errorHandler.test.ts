import Fastify, { type FastifyInstance, type FastifyRequest } from "fastify";
import { GraphQLError } from "graphql";
import mercurius from "mercurius";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { errorHandlerPlugin } from "~/src/fastifyPlugins/errorHandler";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaRestError } from "~/src/utilities/errors/TalawaRestError";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

vi.mock("~/src/graphql/schemaManager", () => ({
	default: {
		buildInitialSchema: vi.fn().mockResolvedValue({}),
		onSchemaUpdate: vi.fn(),
		setLogger: vi.fn(),
	},
}));

vi.mock("mercurius");

vi.mock("~/src/utilities/leakyBucket", () => ({
	default: vi.fn().mockResolvedValue(true),
}));

vi.mock("~/src/utilities/dataloaders", () => ({
	createDataloaders: vi.fn().mockReturnValue({}),
}));

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

		// Mock dependencies required by graphql plugin
		app.decorate("envConfig", {
			API_IS_GRAPHIQL: false,
			API_GRAPHQL_MUTATION_BASE_COST: 1,
			API_RATE_LIMIT_BUCKET_CAPACITY: 100,
			API_RATE_LIMIT_REFILL_RATE: 1,
			API_JWT_EXPIRES_IN: "15m",
			API_REFRESH_TOKEN_EXPIRES_IN: "7d",
			API_COOKIE_DOMAIN: "localhost",
			API_IS_SECURE_COOKIES: false,
		});

		app.decorate("cache", {
			get: vi.fn(),
			set: vi.fn(),
			del: vi.fn(),
		});

		app.decorate("drizzleClient", {});
		app.decorate("minio", {});

		app.decorate("jwt", {
			verify: vi.fn(),
			sign: vi.fn(),
		});

		// Mock Mercurius execution to test errorFormatter integration
		vi.mocked(mercurius).mockImplementation(async (fastify, options) => {
			fastify.decorate("graphql", {
				replaceSchema: vi.fn(),
				addHook: vi.fn(),
			} as unknown as FastifyInstance["graphql"]);

			fastify.post("/graphql", async (request, reply) => {
				const { query } = request.body as { query: string };

				if (query.includes("unhandled-error")) {
					throw new Error("Unhandled system error");
				}

				if (query.includes("unhandled-details")) {
					throw new TalawaRestError({
						code: ErrorCode.INVALID_ARGUMENTS,
						message: "Detailed failure",
						details: { reason: "bad luck" },
					});
				}

				if (query.includes("unhandled-no-details")) {
					throw new TalawaRestError({
						code: ErrorCode.NOT_FOUND,
						message: "Resource not found",
					});
				}

				const execution: {
					data: unknown;
					errors: Array<GraphQLError>;
				} = { data: null, errors: [] };

				try {
					if (query.includes("error")) {
						throw new TalawaGraphQLError({
							message: "Not authenticated",
							extensions: {
								code: ErrorCode.UNAUTHENTICATED,
							},
						});
					}
					if (query.includes("details")) {
						throw new TalawaGraphQLError({
							message: "Invalid args",
							extensions: {
								code: ErrorCode.INVALID_ARGUMENTS,
								details: { invalidField: "foo" },
							},
						});
					}
					if (query.includes("generic")) {
						throw new Error("Generic GraphQL error");
					}
					if (query.includes("nonExistentField")) {
						// Simulate validation error handled by errorFormatter
						throw new TalawaGraphQLError({
							message: "Cannot query field",
							extensions: {
								code: ErrorCode.INVALID_ARGUMENTS,
								details: { field: "nonExistentField" },
							},
						});
					}

					execution.data = { hello: "world" };
				} catch (err) {
					const gqlError =
						err instanceof GraphQLError
							? err
							: new GraphQLError((err as Error).message, {
									originalError: err as Error,
								});
					execution.errors = [gqlError];
				}

				if (execution.errors.length > 0 && options.errorFormatter) {
					const result = options.errorFormatter(
						execution as unknown as Parameters<
							NonNullable<typeof options.errorFormatter>
						>[0],
						{ reply } as Parameters<
							NonNullable<typeof options.errorFormatter>
						>[1],
					);
					return reply.status(result.statusCode).send(result.response);
				}

				return reply.send(execution);
			});
		});

		await app.register(errorHandlerPlugin);
		// Register real GraphQL plugin (which will use our mocked mercurius)
		const { graphql: graphqlPlugin } = await import("~/src/routes/graphql");
		await app.register(graphqlPlugin);

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
					path: ["body", "title"],
					message: "Expected string, received number",
				},
			]);
		});

		// Add a route that throws a generic error
		app.get("/generic-error", async () => {
			throw new Error("Generic error message");
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

		// Route with schema validation for Fastify validation errors
		app.post("/validate", {
			schema: {
				body: {
					type: "object",
					required: ["name"],
					properties: {
						name: { type: "string" },
						age: { type: "number" },
					},
				},
			},
			handler: async () => ({ success: true }),
		});

		// Edge case routes for different error types
		app.get("/null-error", async () => {
			throw null;
		});

		app.get("/undefined-error", async () => {
			throw undefined;
		});

		app.get("/string-error", async () => {
			throw "String error message";
		});

		app.get("/object-error", async () => {
			throw { message: "Object error message", someField: "value" };
		});

		app.get("/arbitrary-object", async () => {
			throw { someField: "value", anotherField: 123 };
		});

		app.get("/number-error", async () => {
			throw 42;
		});

		// Additional error code routes
		app.get("/token-expired", async () => {
			throw new TalawaRestError({
				code: ErrorCode.TOKEN_EXPIRED,
				message: "Token has expired",
			});
		});

		app.get("/token-invalid", async () => {
			throw new TalawaRestError({
				code: ErrorCode.TOKEN_INVALID,
				message: "Token is invalid",
			});
		});

		app.get("/insufficient-permissions", async () => {
			throw new TalawaRestError({
				code: ErrorCode.INSUFFICIENT_PERMISSIONS,
				message: "Insufficient permissions",
			});
		});

		app.get("/already-exists", async () => {
			throw new TalawaRestError({
				code: ErrorCode.ALREADY_EXISTS,
				message: "Resource already exists",
			});
		});

		app.get("/invalid-input", async () => {
			throw new TalawaRestError({
				code: ErrorCode.INVALID_INPUT,
				message: "Invalid input provided",
			});
		});

		app.get("/database-error", async () => {
			throw new TalawaRestError({
				code: ErrorCode.DATABASE_ERROR,
				message: "Database operation failed",
			});
		});

		app.get("/external-service-error", async () => {
			throw new TalawaRestError({
				code: ErrorCode.EXTERNAL_SERVICE_ERROR,
				message: "External service unavailable",
			});
		});

		app.get("/deprecated", async () => {
			throw new TalawaRestError({
				code: ErrorCode.DEPRECATED,
				message: "This endpoint is deprecated",
			});
		});

		app.get("/args-resources-not-found", async () => {
			throw new TalawaRestError({
				code: ErrorCode.ARGUMENTS_ASSOCIATED_RESOURCES_NOT_FOUND,
				message: "Associated resources not found",
			});
		});

		app.get("/forbidden-action-args", async () => {
			throw new TalawaRestError({
				code: ErrorCode.FORBIDDEN_ACTION_ON_ARGUMENTS_ASSOCIATED_RESOURCES,
				message: "Forbidden action on associated resources",
			});
		});

		app.get("/forbidden-action", async () => {
			throw new TalawaRestError({
				code: ErrorCode.FORBIDDEN_ACTION,
				message: "Forbidden action",
			});
		});

		app.get("/unauthorized-action-args", async () => {
			throw new TalawaRestError({
				code: ErrorCode.UNAUTHORIZED_ACTION_ON_ARGUMENTS_ASSOCIATED_RESOURCES,
				message: "Unauthorized action on associated resources",
			});
		});

		app.get("/unexpected", async () => {
			throw new TalawaRestError({
				code: ErrorCode.UNEXPECTED,
				message: "Unexpected error occurred",
			});
		});

		app.get("/custom-status", async () => {
			throw new TalawaRestError({
				code: ErrorCode.NOT_FOUND,
				message: "Custom status",
				statusCodeOverride: 418,
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
					query: "{ error }",
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
			// Validation error code
			expect(body.errors[0].extensions.code).toBe("invalid_arguments");
		});

		it("handles generic errors in GraphQL with standard format", async () => {
			const res = await app.inject({
				method: "POST",
				url: "/graphql",
				headers: {
					"content-type": "application/json",
				},
				payload: JSON.stringify({
					query: "{ generic }",
				}),
			});

			expect(res.statusCode).toBe(200);
			const body = res.json();
			expect(body.errors[0].message).toMatch(
				/Generic GraphQL error|Internal Server Error/,
			);
			expect(body.errors[0].extensions.code).toBe(
				ErrorCode.INTERNAL_SERVER_ERROR,
			);
		});

		it("includes details in GraphQL error response when present", async () => {
			const res = await app.inject({
				method: "POST",
				url: "/graphql",
				headers: {
					"content-type": "application/json",
				},
				payload: JSON.stringify({
					query: "{ details }",
				}),
			});

			expect(res.statusCode).toBe(200);
			const body = res.json();
			expect(body.errors[0].extensions.code).toBe("invalid_arguments");
			expect(body.errors[0].extensions.details).toEqual({
				invalidField: "foo",
			});
		});

		it("handles unhandled errors caught by global handler", async () => {
			vi.stubEnv("NODE_ENV", "production");
			const res = await app.inject({
				method: "POST",
				url: "/graphql",
				headers: {
					"content-type": "application/json",
				},
				payload: JSON.stringify({
					query: "{ unhandled-error }",
				}),
			});

			// Should be 500 Internal Server Error
			expect(res.statusCode).toBe(500);
			const body = res.json();
			expect(body.errors[0].message).toBe("Internal Server Error");
			expect(body.errors[0].extensions.code).toBe(
				ErrorCode.INTERNAL_SERVER_ERROR,
			);
			expect(body.errors[0].extensions.httpStatus).toBe(500);
			expect(body.errors[0].extensions.details).toBeUndefined();
			expect(body.errors[0].extensions.correlationId).toBe(
				"generated-correlation-id",
			);
			vi.stubEnv("NODE_ENV", "test");
		});

		it("handles unhandled errors with details caught by global handler", async () => {
			const res = await app.inject({
				method: "POST",
				url: "/graphql",
				headers: {
					"content-type": "application/json",
				},
				payload: JSON.stringify({
					query: "{ unhandled-details }",
				}),
			});

			expect(res.statusCode).toBe(400);
			const body = res.json();
			expect(body.errors[0].message).toBe("Detailed failure");
			expect(body.errors[0].extensions.code).toBe(ErrorCode.INVALID_ARGUMENTS);
			// TalawaRestError status is preserved
			expect(body.errors[0].extensions.httpStatus).toBe(400);
			expect(body.errors[0].extensions.details).toEqual({ reason: "bad luck" });
		});

		it("handles unhandled errors without details caught by global handler", async () => {
			const res = await app.inject({
				method: "POST",
				url: "/graphql",
				headers: {
					"content-type": "application/json",
				},
				payload: JSON.stringify({
					query: "{ unhandled-no-details }",
				}),
			});

			expect(res.statusCode).toBe(404);
			const body = res.json();
			expect(body.errors[0].message).toBe("Resource not found");
			expect(body.errors[0].extensions.code).toBe(ErrorCode.NOT_FOUND);
			expect(body.errors[0].extensions.httpStatus).toBe(404);
			// This should NOT have details in extensions
			expect(body.errors[0].extensions.details).toBeUndefined();
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
			vi.stubEnv("NODE_ENV", "production");
			const res = await app.inject({ method: "GET", url: "/generic-error" });
			expect(res.statusCode).toBe(500);
			const body = res.json();

			expect(body).toEqual({
				error: {
					code: ErrorCode.INTERNAL_SERVER_ERROR,
					message: expect.any(String),
					correlationId: "generated-correlation-id",
				},
			});
			vi.stubEnv("NODE_ENV", "test");
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

		it("handles Fastify validation errors", async () => {
			const res = await app.inject({
				method: "POST",
				url: "/validate",
				headers: {
					"content-type": "application/json",
				},
				payload: JSON.stringify({ age: "not-a-number" }),
			});

			expect(res.statusCode).toBe(400);
			const body = res.json();
			expect(body.error.code).toBe(ErrorCode.INVALID_ARGUMENTS);
			expect(body.error.message).toBe("Validation failed");
			expect(body.error.details).toBeDefined();
		});
	});

	describe("Edge Cases and Error Types", () => {
		it("handles null error", async () => {
			const res = await app.inject({ method: "GET", url: "/null-error" });
			expect(res.statusCode).toBe(500);
			const body = res.json();
			expect(body.error.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
			expect(body.error.details).toBe("null");
		});

		it("handles undefined error", async () => {
			const res = await app.inject({ method: "GET", url: "/undefined-error" });
			expect(res.statusCode).toBe(500);
			const body = res.json();
			expect(body.error.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
			expect(body.error.details).toBe("undefined");
		});

		it("handles string error", async () => {
			const res = await app.inject({ method: "GET", url: "/string-error" });
			expect(res.statusCode).toBe(500);
			const body = res.json();
			expect(body.error.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
			expect(body.error.details).toBe("String error message");
		});

		it("handles object with message property", async () => {
			const res = await app.inject({ method: "GET", url: "/object-error" });
			expect(res.statusCode).toBe(500);
			const body = res.json();
			expect(body.error.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
			expect(body.error.details).toBe("Object error message");
		});

		it("handles arbitrary object without message", async () => {
			const res = await app.inject({
				method: "GET",
				url: "/arbitrary-object",
			});
			expect(res.statusCode).toBe(500);
			const body = res.json();
			expect(body.error.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
			expect(body.error.details).toBeDefined();
		});

		it("handles number error", async () => {
			const res = await app.inject({ method: "GET", url: "/number-error" });
			expect(res.statusCode).toBe(500);
			const body = res.json();
			expect(body.error.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
			expect(body.error.details).toBe("42");
		});
	});

	describe("Additional Error Codes", () => {
		it("handles TOKEN_EXPIRED error (401)", async () => {
			const res = await app.inject({ method: "GET", url: "/token-expired" });
			expect(res.statusCode).toBe(401);
			const body = res.json();
			expect(body.error.code).toBe(ErrorCode.TOKEN_EXPIRED);
		});

		it("handles TOKEN_INVALID error (401)", async () => {
			const res = await app.inject({ method: "GET", url: "/token-invalid" });
			expect(res.statusCode).toBe(401);
			const body = res.json();
			expect(body.error.code).toBe(ErrorCode.TOKEN_INVALID);
		});

		it("handles INSUFFICIENT_PERMISSIONS error (403)", async () => {
			const res = await app.inject({
				method: "GET",
				url: "/insufficient-permissions",
			});
			expect(res.statusCode).toBe(403);
			const body = res.json();
			expect(body.error.code).toBe(ErrorCode.INSUFFICIENT_PERMISSIONS);
		});

		it("handles ALREADY_EXISTS error (409)", async () => {
			const res = await app.inject({ method: "GET", url: "/already-exists" });
			expect(res.statusCode).toBe(409);
			const body = res.json();
			expect(body.error.code).toBe(ErrorCode.ALREADY_EXISTS);
		});

		it("handles INVALID_INPUT error (400)", async () => {
			const res = await app.inject({ method: "GET", url: "/invalid-input" });
			expect(res.statusCode).toBe(400);
			const body = res.json();
			expect(body.error.code).toBe(ErrorCode.INVALID_INPUT);
		});

		it("handles DATABASE_ERROR error (500)", async () => {
			const res = await app.inject({ method: "GET", url: "/database-error" });
			expect(res.statusCode).toBe(500);
			const body = res.json();
			expect(body.error.code).toBe(ErrorCode.DATABASE_ERROR);
		});

		it("handles EXTERNAL_SERVICE_ERROR error (502)", async () => {
			const res = await app.inject({
				method: "GET",
				url: "/external-service-error",
			});
			expect(res.statusCode).toBe(502);
			const body = res.json();
			expect(body.error.code).toBe(ErrorCode.EXTERNAL_SERVICE_ERROR);
		});

		it("handles DEPRECATED error (400)", async () => {
			const res = await app.inject({ method: "GET", url: "/deprecated" });
			expect(res.statusCode).toBe(400);
			const body = res.json();
			expect(body.error.code).toBe(ErrorCode.DEPRECATED);
		});

		it("handles ARGUMENTS_ASSOCIATED_RESOURCES_NOT_FOUND error (404)", async () => {
			const res = await app.inject({
				method: "GET",
				url: "/args-resources-not-found",
			});
			expect(res.statusCode).toBe(404);
			const body = res.json();
			expect(body.error.code).toBe(
				ErrorCode.ARGUMENTS_ASSOCIATED_RESOURCES_NOT_FOUND,
			);
		});

		it("handles FORBIDDEN_ACTION_ON_ARGUMENTS_ASSOCIATED_RESOURCES error (403)", async () => {
			const res = await app.inject({
				method: "GET",
				url: "/forbidden-action-args",
			});
			expect(res.statusCode).toBe(403);
			const body = res.json();
			expect(body.error.code).toBe(
				ErrorCode.FORBIDDEN_ACTION_ON_ARGUMENTS_ASSOCIATED_RESOURCES,
			);
		});

		it("handles FORBIDDEN_ACTION error (403)", async () => {
			const res = await app.inject({
				method: "GET",
				url: "/forbidden-action",
			});
			expect(res.statusCode).toBe(403);
			const body = res.json();
			expect(body.error.code).toBe(ErrorCode.FORBIDDEN_ACTION);
		});

		it("handles UNAUTHORIZED_ACTION_ON_ARGUMENTS_ASSOCIATED_RESOURCES error (403)", async () => {
			const res = await app.inject({
				method: "GET",
				url: "/unauthorized-action-args",
			});
			expect(res.statusCode).toBe(403);
			const body = res.json();
			expect(body.error.code).toBe(
				ErrorCode.UNAUTHORIZED_ACTION_ON_ARGUMENTS_ASSOCIATED_RESOURCES,
			);
		});

		it("handles UNEXPECTED error (500)", async () => {
			const res = await app.inject({ method: "GET", url: "/unexpected" });
			expect(res.statusCode).toBe(500);
			const body = res.json();
			expect(body.error.code).toBe(ErrorCode.UNEXPECTED);
		});

		it("handles custom status code override", async () => {
			const res = await app.inject({ method: "GET", url: "/custom-status" });
			expect(res.statusCode).toBe(418);
			const body = res.json();
			expect(body.error.code).toBe(ErrorCode.NOT_FOUND);
		});
	});

	describe("GraphQL Error Edge Cases", () => {
		it("handles GraphQL request with query parameters", async () => {
			const res = await app.inject({
				method: "POST",
				url: "/graphql?debug=true",
				headers: {
					"content-type": "application/json",
				},
				payload: JSON.stringify({
					query: "{ error }",
				}),
			});

			expect(res.statusCode).toBe(200);
			const body = res.json();
			expect(body.errors).toBeDefined();
			expect(body.errors[0].extensions.code).toBe("unauthenticated");
		});

		it("handles GraphQL error without details field", async () => {
			const res = await app.inject({
				method: "POST",
				url: "/graphql",
				headers: {
					"content-type": "application/json",
				},
				payload: JSON.stringify({
					query: "{ error }",
				}),
			});

			expect(res.statusCode).toBe(200);
			const body = res.json();
			expect(body.errors[0].extensions.details).toBeUndefined();
		});
	});
});
