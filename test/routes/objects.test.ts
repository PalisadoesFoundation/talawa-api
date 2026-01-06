import { Readable } from "node:stream";
import Fastify from "fastify";
import { type Client, S3Error } from "minio";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { errorHandlerPlugin } from "~/src/fastifyPlugins/errorHandler";
import { objects } from "~/src/routes/objects";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";
import { TalawaRestError } from "~/src/utilities/errors/TalawaRestError";
import { testEnvConfig } from "../envConfigSchema";

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
			throw new TalawaRestError({
				code: ErrorCode.INTERNAL_SERVER_ERROR,
				message: "Generic error message",
			});
		}

		// Success case
		return { name, content: "mock object content" };
	});

	return app;
};

describe("Error handler integration using mocked objects route", () => {
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

interface MockMinioClient {
	getObject: ReturnType<typeof vi.fn>;
	statObject: ReturnType<typeof vi.fn>;
}

interface MockMinio {
	client: MockMinioClient;
	bucketName: string;
}

describe("Objects route with MinIO integration", () => {
	let app: Awaited<ReturnType<typeof Fastify>> & { minio: MockMinio };

	beforeEach(async () => {
		const fastifyApp = Fastify();

		// Register error handler
		await fastifyApp.register(errorHandlerPlugin);

		// Mock MinIO client
		fastifyApp.decorate("minio", {
			client: {
				getObject: vi.fn(),
				statObject: vi.fn(),
			} as unknown as Client,
			bucketName: "talawa",
			config: {
				endPoint: testEnvConfig.API_MINIO_TEST_END_POINT,
				port: testEnvConfig.API_MINIO_TEST_PORT,
			},
		});

		// Register the actual objects route
		await fastifyApp.register(objects);

		app = fastifyApp as typeof app;
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
	it("should return 200 and file stream for valid object", async () => {
		const mockStream = Readable.from(["file content"]);
		const mockStat = {
			size: 12,
			metaData: { "content-type": "text/plain" },
		};

		app.minio.client.getObject.mockResolvedValue(mockStream);
		app.minio.client.statObject.mockResolvedValue(mockStat);

		const response = await app.inject({
			method: "GET",
			url: "/objects/valid-file.txt",
		});

		expect(response.statusCode).toBe(200);
		expect(response.body).toBe("file content");
		// The implementation sets "inline", checking implementation details
		expect(response.headers["content-disposition"]).toBe(
			"inline; filename=valid-file.txt",
		);
		expect(response.headers["content-type"]).toBe("text/plain");
		expect(response.headers["content-length"]).toBe("12");
	});

	it("should return 400 for object name > 36 chars", async () => {
		const longName = "a".repeat(37);
		const response = await app.inject({
			method: "GET",
			url: `/objects/${longName}`,
		});

		expect(response.statusCode).toBe(400);
	});

	it("should use fallback content-type when metadata lacks content-type", async () => {
		const mockStream = Readable.from(["binary content"]);
		const mockStat = {
			size: 14,
			metaData: {}, // Empty metadata without content-type
		};

		app.minio.client.getObject.mockResolvedValue(mockStream);
		app.minio.client.statObject.mockResolvedValue(mockStat);

		const response = await app.inject({
			method: "GET",
			url: "/objects/binary-file.bin",
		});

		expect(response.statusCode).toBe(200);
		expect(response.headers["content-type"]).toBe("application/octet-stream");
		expect(response.headers["content-length"]).toBe("14");
	});

	it("should use fallback content-type when metadata content-type is not a string", async () => {
		const mockStream = Readable.from(["binary content"]);
		const mockStat = {
			size: 14,
			metaData: { "content-type": 123 }, // Non-string content-type
		};

		app.minio.client.getObject.mockResolvedValue(mockStream);
		app.minio.client.statObject.mockResolvedValue(mockStat);

		const response = await app.inject({
			method: "GET",
			url: "/objects/binary-file.bin",
		});

		expect(response.statusCode).toBe(200);
		expect(response.headers["content-type"]).toBe("application/octet-stream");
		expect(response.headers["content-length"]).toBe("14");
	});
});
