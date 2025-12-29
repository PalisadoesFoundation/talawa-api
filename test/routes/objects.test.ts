import Fastify from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { errorHandlerPlugin } from "~/src/fastifyPlugins/errorHandler";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaRestError } from "~/src/utilities/errors/TalawaRestError";

// Mock the objects route behavior for testing
const createTestApp = async () => {
	const app = Fastify();

	// Register error handler
	await app.register(errorHandlerPlugin);

	// Mock objects route that throws TalawaRestError
	app.get("/objects/:name", async (request, _reply) => {
		const { name } = request.params as { name: string };

		if (name === "not-found") {
			throw new TalawaRestError({
				code: ErrorCode.NOT_FOUND,
				message: `No object found with the name "${name}".`,
				details: { name },
			});
		}

		if (name === "server-error") {
			throw new TalawaRestError({
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				message: "Something went wrong. Please try again later.",
				details: { error: "Simulated server error" },
			});
		}

		if (name === "generic-error") {
			throw new Error("Generic error message");
		}

		// Success case
		return { name, content: "mock object content" };
	});

	return app;
};

describe("Objects route error handling", () => {
	let app: Awaited<ReturnType<typeof createTestApp>>;

	beforeEach(async () => {
		app = await createTestApp();
	});

	afterEach(async () => {
		await app.close();
	});

	it("should return 404 for not found objects", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/objects/not-found",
		});

		expect(response.statusCode).toBe(404);

		const body = response.json();
		expect(body).toEqual({
			error: {
				code: "not_found",
				message: 'No object found with the name "not-found".',
				details: { name: "not-found" },
				correlationId: expect.any(String),
			},
		});
	});

	it("should return 500 for server errors", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/objects/server-error",
		});

		expect(response.statusCode).toBe(500);

		const body = response.json();
		expect(body).toEqual({
			error: {
				code: "internal_server_error",
				message: "Something went wrong. Please try again later.",
				details: { error: "Simulated server error" },
				correlationId: expect.any(String),
			},
		});
	});

	it("should handle generic errors as 500", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/objects/generic-error",
		});

		expect(response.statusCode).toBe(500);

		const body = response.json();
		expect(body).toEqual({
			error: {
				code: "internal_server_error",
				message: "Generic error message",
				details: undefined,
				correlationId: expect.any(String),
			},
		});
	});

	it("should return successful response for valid objects", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/objects/valid-object",
		});

		expect(response.statusCode).toBe(200);

		const body = response.json();
		expect(body).toEqual({
			name: "valid-object",
			content: "mock object content",
		});
	});

	it("should include correlationId in error responses", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/objects/not-found",
		});

		const body = response.json();
		expect(body.error.correlationId).toBeDefined();
		expect(typeof body.error.correlationId).toBe("string");
		expect(body.error.correlationId.length).toBeGreaterThan(0);
	});

	it("should use TalawaRestError.toJSON() for structured errors", async () => {
		const response = await app.inject({
			method: "GET",
			url: "/objects/not-found",
		});

		const body = response.json();

		// Verify the structure matches TalawaRestError.toJSON() output
		expect(body).toHaveProperty("error");
		expect(body.error).toHaveProperty("code");
		expect(body.error).toHaveProperty("message");
		expect(body.error).toHaveProperty("details");
		expect(body.error).toHaveProperty("correlationId");

		expect(body.error.code).toBe("not_found");
	});
});
