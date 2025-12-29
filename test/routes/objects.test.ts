import Fastify from "fastify";
import { S3Error } from "minio";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { errorHandlerPlugin } from "~/src/fastifyPlugins/errorHandler";
import { objects } from "~/src/routes/objects";
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

describe("Objects route with MinIO integration", () => {
	let app: Awaited<ReturnType<typeof Fastify>>;

	beforeEach(async () => {
		app = Fastify();

		// Register error handler
		await app.register(errorHandlerPlugin);

		// Mock MinIO client
		app.decorate("minio", {
			client: {
				getObject: vi.fn(),
				statObject: vi.fn(),
			},
			bucketName: "test-bucket",
		});

		// Register the actual objects route
		await app.register(objects);
	});

	afterEach(async () => {
		await app.close();
		vi.clearAllMocks();
	});

	it("should return 404 for NoSuchKey S3Error", async () => {
		const s3Error = new S3Error("The specified key does not exist.");
		s3Error.code = "NoSuchKey";

		app.minio.client.getObject.mockRejectedValue(s3Error);
		app.minio.client.statObject.mockRejectedValue(s3Error);

		const response = await app.inject({
			method: "GET",
			url: "/objects/missing-file.pdf",
		});

		expect(response.statusCode).toBe(404);
		const body = response.json();
		expect(body).toEqual({
			error: {
				code: "not_found",
				message: 'No object found with the name "missing-file.pdf".',
				details: { name: "missing-file.pdf" },
				correlationId: expect.any(String),
			},
		});
	});

	it("should return 404 for NotFound S3Error", async () => {
		const s3Error = new S3Error("Not Found");
		s3Error.code = "NotFound";

		app.minio.client.getObject.mockRejectedValue(s3Error);
		app.minio.client.statObject.mockRejectedValue(s3Error);

		const response = await app.inject({
			method: "GET",
			url: "/objects/another-missing.jpg",
		});

		expect(response.statusCode).toBe(404);
		const body = response.json();
		expect(body).toEqual({
			error: {
				code: "not_found",
				message: 'No object found with the name "another-missing.jpg".',
				details: { name: "another-missing.jpg" },
				correlationId: expect.any(String),
			},
		});
	});

	it("should return 500 for generic MinIO errors", async () => {
		const genericError = new Error("Connection timeout");

		app.minio.client.getObject.mockRejectedValue(genericError);
		app.minio.client.statObject.mockRejectedValue(genericError);

		const response = await app.inject({
			method: "GET",
			url: "/objects/test-file.txt",
		});

		expect(response.statusCode).toBe(500);
		const body = response.json();
		expect(body).toEqual({
			error: {
				code: "internal_server_error",
				message: "Something went wrong. Please try again later.",
				details: { message: "Connection timeout" },
				correlationId: expect.any(String),
			},
		});
	});

	it("should return 500 for S3Error with unhandled code", async () => {
		const s3Error = new S3Error("Access Denied");
		s3Error.code = "AccessDenied";

		app.minio.client.getObject.mockRejectedValue(s3Error);
		app.minio.client.statObject.mockRejectedValue(s3Error);

		const response = await app.inject({
			method: "GET",
			url: "/objects/auth-error.txt",
		});

		expect(response.statusCode).toBe(500);
		const body = response.json();
		expect(body).toEqual({
			error: {
				code: "internal_server_error",
				message: "Something went wrong. Please try again later.",
				details: { message: "Access Denied" },
				correlationId: expect.any(String),
			},
		});
	});
});
