import { Readable } from "node:stream";
import type { FastifyInstance, LightMyRequestResponse } from "fastify";
import type { BucketItemStat } from "minio";
import { S3Error } from "minio";
import { testEnvConfig } from "test/envConfigSchema";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getTier } from "~/src/config/rateLimits";
import { createServer } from "~/src/createServer";
import { ErrorCode } from "~/src/utilities/errors/errorCodes";

const expectValidErrorResponse = (
	body: { error: Record<string, unknown> },
	expectedCode: string,
	message?: string,
	detailsMatcher?: (d: unknown) => void,
) => {
	expect(body.error.code).toBe(expectedCode);
	expect(body.error.correlationId).toBeDefined();
	expect(typeof body.error.correlationId).toBe("string");
	expect((body.error.correlationId as string).length).toBeGreaterThan(0);

	if (message) {
		expect(body.error.message).toContain(message);
	}
	if (detailsMatcher) {
		expect(body.error.details).toBeDefined();
		detailsMatcher(body.error.details);
	}
};

describe("/objects/:name route", () => {
	let app: FastifyInstance;

	beforeEach(() => {
		vi.clearAllMocks();
		// Reset shared mock bucket state
		const globalWithMock = global as unknown as {
			__mockBucketState: Record<string, number>;
		};
		globalWithMock.__mockBucketState = {};
	});

	// Mock other external dependencies to avoid connection errors and speed up tests
	vi.mock("~/src/fastifyPlugins/drizzleClient", () => ({
		default: async () => {},
	}));
	vi.mock("~/src/fastifyPlugins/backgroundWorkers", () => ({
		default: async () => {},
	}));
	vi.mock("~/src/fastifyPlugins/seedInitialData", () => ({
		default: async () => {},
	}));
	vi.mock("~/src/fastifyPlugins/pluginSystem", () => ({
		default: async () => {},
	}));
	vi.mock("~/src/fastifyPlugins/performance", () => ({
		default: async () => {},
	}));

	// Mock Redis to avoid connection errors
	vi.mock("@fastify/redis", async () => {
		const fp = await import("fastify-plugin");
		return {
			default: fp.default(
				async (fastify: {
					decorate: (key: string, value: unknown) => void;
				}) => {
					fastify.decorate("redis", {
						status: "ready",
						quit: async () => "OK",
						pipeline: () => ({ exec: async () => [] }),
					});
				},
				{ name: "@fastify/redis" },
			),
		};
	});

	// Mock leakyBucket to control rate limiting behavior
	vi.mock("~/src/utilities/leakyBucket", () => ({
		leakyBucket: vi
			.fn()
			.mockImplementation(
				async (_redis, key: string, max: number, _windowMs) => {
					const globalWithMock = global as unknown as {
						__mockBucketState: Record<string, number>;
					};
					const bucketState = globalWithMock.__mockBucketState || {};
					globalWithMock.__mockBucketState = bucketState;

					const count = (bucketState[key] || 0) + 1;
					bucketState[key] = count;

					const allowed = count <= max;
					const remaining = Math.max(0, max - count);
					const resetAt = Date.now() + 10000; // future

					return { allowed, remaining, resetAt };
				},
			),
	}));

	afterEach(async () => {
		if (app) {
			await app.close();
		}
	});

	describe("rate limiting", () => {
		it("should apply normal tier rate limiting", async () => {
			app = await createServer({
				envConfig: {
					API_POSTGRES_HOST: testEnvConfig.API_POSTGRES_TEST_HOST,
					API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
					API_MINIO_END_POINT: testEnvConfig.API_MINIO_TEST_END_POINT,
					API_COOKIE_SECRET: testEnvConfig.API_COOKIE_SECRET,
				},
			});

			// Mock MinIO client
			const mockStream = new Readable({
				read() {
					this.push("test file content");
					this.push(null);
				},
			});

			const mockStat: BucketItemStat = {
				size: 100,
				etag: "test-etag",
				lastModified: new Date(),
				metaData: { "content-type": "text/plain" },
			};

			vi.spyOn(app.minio.client, "getObject").mockResolvedValue(mockStream);
			vi.spyOn(app.minio.client, "statObject").mockResolvedValue(mockStat);

			const res = await app.inject({
				method: "GET",
				url: "/objects/test-file.txt",
			});

			// Verify rate limit headers are present
			expect(res.headers["x-ratelimit-limit"]).toBeDefined();
			expect(res.headers["x-ratelimit-remaining"]).toBeDefined();
			expect(res.headers["x-ratelimit-reset"]).toBeDefined();

			// Verify the limit is for "normal" tier
			const limit = Number(res.headers["x-ratelimit-limit"]);
			const normalTier = getTier("normal");
			expect(limit).toBe(normalTier.max);
		});

		it("should return 429 when rate limit is exceeded", async () => {
			app = await createServer({
				envConfig: {
					API_POSTGRES_HOST: testEnvConfig.API_POSTGRES_TEST_HOST,
					API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
					API_MINIO_END_POINT: testEnvConfig.API_MINIO_TEST_END_POINT,
					API_COOKIE_SECRET: testEnvConfig.API_COOKIE_SECRET,
				},
			});

			// Mock MinIO to return successful responses
			const mockStat: BucketItemStat = {
				size: 100,
				etag: "test-etag",
				lastModified: new Date(),
				metaData: { "content-type": "text/plain" },
			};

			vi.spyOn(app.minio.client, "getObject").mockImplementation(() => {
				const stream = new Readable({
					read() {
						this.push("test file content");
						this.push(null);
					},
				});
				return Promise.resolve(stream);
			});
			vi.spyOn(app.minio.client, "statObject").mockResolvedValue(mockStat);

			// Make requests until rate limit is hit
			const normalTier = getTier("normal");
			const maxAttempts = normalTier.max + 20; // Ensure we exceed it
			let lastResponse: LightMyRequestResponse | undefined;
			let attempts = 0;

			for (attempts = 0; attempts < maxAttempts; attempts++) {
				lastResponse = await app.inject({
					method: "GET",
					url: "/objects/test-file.txt",
					remoteAddress: "127.0.0.100", // Unique IP for this test to accumulate hits
				});

				if (lastResponse.statusCode === 429) {
					break;
				}
			}

			// Verify we eventually got rate limited
			expect(lastResponse?.statusCode).toBe(429);

			// Verify error response structure
			const body = JSON.parse(lastResponse?.body || "{}");
			expect(body.error).toHaveProperty("message");
			expect(body.error).toHaveProperty("code");
			expect(body.error.message).toContain("Too many requests");
			expect(body.error.correlationId).toBeDefined();
			expect(typeof body.error.correlationId).toBe("string");

			// Verify resetAt is in seconds (epoch timestamp)
			if (body.error.details?.resetAt) {
				const resetAt = body.error.details.resetAt;
				// resetAt should be a reasonable epoch timestamp in seconds
				const now = Math.floor(Date.now() / 1000);
				const windowSeconds = Math.ceil(normalTier.windowMs / 1000);
				expect(resetAt).toBeGreaterThan(now);
				expect(resetAt).toBeLessThanOrEqual(now + windowSeconds + 10); // Within window + buffer
			}
		});

		it("should include X-RateLimit-Reset header in seconds (epoch)", async () => {
			app = await createServer({
				envConfig: {
					API_POSTGRES_HOST: testEnvConfig.API_POSTGRES_TEST_HOST,
					API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
					API_MINIO_END_POINT: testEnvConfig.API_MINIO_TEST_END_POINT,
					API_COOKIE_SECRET: testEnvConfig.API_COOKIE_SECRET,
				},
			});

			const mockStream = new Readable({
				read() {
					this.push("test file content");
					this.push(null);
				},
			});

			const mockStat: BucketItemStat = {
				size: 100,
				etag: "test-etag",
				lastModified: new Date(),
				metaData: { "content-type": "text/plain" },
			};

			vi.spyOn(app.minio.client, "getObject").mockResolvedValue(mockStream);
			vi.spyOn(app.minio.client, "statObject").mockResolvedValue(mockStat);

			const res = await app.inject({
				method: "GET",
				url: "/objects/test-file.txt",
				remoteAddress: "127.0.0.101", // Unique IP
			});

			const resetAt = Number(res.headers["x-ratelimit-reset"]);
			const now = Math.floor(Date.now() / 1000);
			const normalTier = getTier("normal");
			const windowSeconds = Math.ceil(normalTier.windowMs / 1000);

			// Verify resetAt is a reasonable epoch timestamp in seconds
			expect(resetAt).toBeGreaterThan(now);
			expect(resetAt).toBeLessThanOrEqual(now + windowSeconds + 10);
		});
	});

	describe("object retrieval", () => {
		// Helper to create server with fresh config for each test
		const setupServer = async () => {
			app = await createServer({
				envConfig: {
					API_POSTGRES_HOST: testEnvConfig.API_POSTGRES_TEST_HOST,
					API_REDIS_HOST: testEnvConfig.API_REDIS_TEST_HOST,
					API_MINIO_END_POINT: testEnvConfig.API_MINIO_TEST_END_POINT,
					API_COOKIE_SECRET: testEnvConfig.API_COOKIE_SECRET,
				},
			});
			return app;
		};

		it("should successfully fetch an object", async () => {
			await setupServer();

			const mockContent = "test file content";
			const mockStream = new Readable({
				read() {
					this.push(mockContent);
					this.push(null);
				},
			});

			const mockStat: BucketItemStat = {
				size: mockContent.length,
				etag: "test-etag",
				lastModified: new Date(),
				metaData: { "content-type": "text/plain" },
			};

			vi.spyOn(app.minio.client, "getObject").mockResolvedValue(mockStream);
			vi.spyOn(app.minio.client, "statObject").mockResolvedValue(mockStat);

			const res = await app.inject({
				method: "GET",
				url: "/objects/test-file.txt",
			});

			expect(res.statusCode).toBe(200);
			expect(res.headers["content-type"]).toBe("text/plain");
			expect(res.headers["content-disposition"]).toContain("test-file.txt");
			expect(res.body).toBe(mockContent);
		});

		it("should return 404 when object does not exist (NoSuchKey)", async () => {
			await setupServer();

			const s3Error = new S3Error("NoSuchKey");
			s3Error.code = "NoSuchKey";

			vi.spyOn(app.minio.client, "getObject").mockRejectedValue(s3Error);
			vi.spyOn(app.minio.client, "statObject").mockRejectedValue(s3Error);

			const res = await app.inject({
				method: "GET",
				url: "/objects/nonexistent.txt",
			});

			expect(res.statusCode).toBe(404);
			const body = JSON.parse(res.body);
			expectValidErrorResponse(
				body,
				ErrorCode.NOT_FOUND,
				"No object found",
				(details) => {
					expect(details).toEqual({ objectName: "nonexistent.txt" });
				},
			);
		});

		it("should return 404 when S3Error is NotFound", async () => {
			await setupServer();

			const s3Error = new S3Error("Not found");
			s3Error.code = "NotFound";

			vi.spyOn(app.minio.client, "getObject").mockRejectedValue(s3Error);
			// We assert that if getObject fails, it handles it.

			const res = await app.inject({
				method: "GET",
				url: "/objects/missing.png",
			});

			expect(res.statusCode).toBe(404);
			const body = JSON.parse(res.body);
			expectValidErrorResponse(
				body,
				ErrorCode.NOT_FOUND,
				undefined,
				(details) => {
					expect(details).toEqual({ objectName: "missing.png" });
				},
			);
		});

		it("should return 500 on internal MinIO errors", async () => {
			await setupServer();

			const error = new Error("Internal MinIO error");

			vi.spyOn(app.minio.client, "getObject").mockRejectedValue(error);
			vi.spyOn(app.minio.client, "statObject").mockRejectedValue(error);

			const res = await app.inject({
				method: "GET",
				url: "/objects/test-file.txt",
			});

			expect(res.statusCode).toBe(500);
			const body = JSON.parse(res.body);
			expectValidErrorResponse(
				body,
				ErrorCode.INTERNAL_SERVER_ERROR,
				"Something went wrong",
			);
		});

		it("should use default content-type when not provided", async () => {
			await setupServer();

			const mockStream = new Readable({
				read() {
					this.push("binary data");
					this.push(null);
				},
			});

			const mockStat: BucketItemStat = {
				size: 100,
				etag: "test-etag",
				lastModified: new Date(),
				metaData: {}, // No content-type
			};

			vi.spyOn(app.minio.client, "getObject").mockResolvedValue(mockStream);
			vi.spyOn(app.minio.client, "statObject").mockResolvedValue(mockStat);

			const res = await app.inject({
				method: "GET",
				url: "/objects/unknown.bin",
			});

			expect(res.statusCode).toBe(200);
			expect(res.headers["content-type"]).toBe("application/octet-stream");
		});

		it("should default content-type when metaData content-type is non-string", async () => {
			await setupServer();

			const mockStream = new Readable({
				read() {
					this.push("binary data");
					this.push(null);
				},
			});

			const mockStat: BucketItemStat = {
				size: 100,
				etag: "test-etag",
				lastModified: new Date(),
				metaData: { "content-type": 123 as unknown as string },
			};

			vi.spyOn(app.minio.client, "getObject").mockResolvedValue(mockStream);
			vi.spyOn(app.minio.client, "statObject").mockResolvedValue(mockStat);

			const res = await app.inject({
				method: "GET",
				url: "/objects/non-string.bin",
			});

			expect(res.statusCode).toBe(200);
			expect(res.headers["content-type"]).toBe("application/octet-stream");
		});

		it("should validate object name length", async () => {
			await setupServer();

			// Test empty name
			const res1 = await app.inject({
				method: "GET",
				url: "/objects/",
			});
			expect(res1.statusCode).toBe(400);

			const body1 = JSON.parse(res1.body);
			expect(body1).toEqual(
				expect.objectContaining({
					error: expect.objectContaining({
						code: ErrorCode.INVALID_ARGUMENTS,
						message: "Validation failed",
						details: expect.arrayContaining([
							expect.objectContaining({
								instancePath: "/name",
								message: "must NOT have fewer than 1 characters",
							}),
						]),
					}),
				}),
			);

			// Test name exceeding max length (37 characters)
			const longName = "a".repeat(37);
			const res2 = await app.inject({
				method: "GET",
				url: `/objects/${longName}`,
			});
			expect(res2.statusCode).toBe(400);

			const body2 = JSON.parse(res2.body);
			expect(body2).toEqual(
				expect.objectContaining({
					error: expect.objectContaining({
						code: ErrorCode.INVALID_ARGUMENTS,
						message: "Validation failed",
						details: expect.arrayContaining([
							expect.objectContaining({
								instancePath: "/name",
								message: "must NOT have more than 36 characters",
							}),
						]),
					}),
				}),
			);
		});
	});
});
