import Fastify, { type FastifyInstance } from "fastify";
import fastifyPlugin from "fastify-plugin";
import { type Client, S3Error } from "minio";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { errorHandlerPlugin } from "~/src/fastifyPlugins/errorHandler";
import objects from "~/src/routes/objects";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";

// Mock the minio plugin to avoid real connection and simplify testing
const mockGetObject = vi.fn();
const mockStatObject = vi.fn();

const mockMinioPlugin = fastifyPlugin(async (fastify: FastifyInstance) => {
	fastify.decorate("minio", {
		bucketName: "talawa",
		client: {
			getObject: mockGetObject,
			statObject: mockStatObject,
		} as unknown as Client,
		config: {
			endPoint: "localhost",
			port: 9000,
		},
	});
});

describe("objects route", () => {
	let app: ReturnType<typeof Fastify>;

	beforeEach(async () => {
		app = Fastify({
			logger: false,
		});

		// Register plugins
		await app.register(errorHandlerPlugin);
		// Mock minio before registering routes
		await app.register(mockMinioPlugin);
		await app.register(objects);

		await app.ready();
	});

	afterEach(async () => {
		await app.close();
		vi.resetAllMocks();
	});

	it("should return the object stream when found", async () => {
		const mockStream = "readable-stream";
		const mockStat = {
			metaData: { "content-type": "image/png" },
		};

		mockGetObject.mockResolvedValue(mockStream);
		mockStatObject.mockResolvedValue(mockStat);

		const res = await app.inject({
			method: "GET",
			url: "/objects/test-image.png",
		});

		expect(res.statusCode).toBe(200);
		expect(res.headers["content-type"]).toBe("image/png");
		expect(res.headers["content-disposition"]).toBe(
			"inline; filename=test-image.png",
		);
		expect(res.payload).toBe(mockStream);

		expect(mockGetObject).toHaveBeenCalledWith("talawa", "test-image.png");
		expect(mockStatObject).toHaveBeenCalledWith("talawa", "test-image.png");
	});

	it("should throw NOT_FOUND when S3Error is NoSuchKey", async () => {
		const s3Error = new S3Error("Key not found");
		s3Error.code = "NoSuchKey";

		mockGetObject.mockRejectedValue(s3Error);

		const res = await app.inject({
			method: "GET",
			url: "/objects/missing.png",
		});

		expect(res.statusCode).toBe(404);
		const body = res.json();
		expect(body.error.code).toBe(ErrorCode.NOT_FOUND);
		expect(body.error.message).toContain("No object found");
		expect(body.error.details).toEqual({ objectName: "missing.png" });
		expect(body.error.correlationId).toSatisfy(
			(id: string) => typeof id === "string" && id.length > 0,
		); // Ensure correlation ID is present and non-empty
	});

	it("should throw NOT_FOUND when S3Error is NotFound", async () => {
		// Some S3 providers like Google Cloud Storage use "NotFound"
		const s3Error = new S3Error("Not found");
		s3Error.code = "NotFound";

		mockGetObject.mockRejectedValue(s3Error);

		const res = await app.inject({
			method: "GET",
			url: "/objects/missing.png",
		});

		expect(res.statusCode).toBe(404);
		const body = res.json();
		expect(body.error.code).toBe(ErrorCode.NOT_FOUND);
		expect(body.error.correlationId).toSatisfy(
			(id: string) => typeof id === "string" && id.length > 0,
		);
	});

	it("should throw INTERNAL_SERVER_ERROR for generic errors", async () => {
		const genericError = new Error("Connection failed");

		mockGetObject.mockRejectedValue(genericError);

		const res = await app.inject({
			method: "GET",
			url: "/objects/error.png",
		});

		expect(res.statusCode).toBe(500);
		const body = res.json();
		expect(body.error.code).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
		expect(body.error.message).toBe(
			"Something went wrong. Please try again later.",
		);
		expect(body.error.correlationId).toSatisfy(
			(id: string) => typeof id === "string" && id.length > 0,
		);
		expect(body.error.details).toBeUndefined();
	});
});
