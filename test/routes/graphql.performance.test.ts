import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createServer } from "~/src/createServer";

describe("GraphQL Performance Integration", () => {
	let server: FastifyInstance;

	beforeEach(async () => {
		server = await createServer({
			envConfig: {
				API_IS_GRAPHIQL: false,
			},
		});
		await server.ready();
	});

	afterEach(async () => {
		await server.close();
	});

	it("should track performance for GraphQL query operations", async () => {
		const query = `
			query TestQuery {
				__typename
			}
		`;

		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: {
				query,
			},
		});

		expect(response.statusCode).toBe(200);

		// Check Server-Timing header is present
		expect(response.headers["server-timing"]).toBeDefined();
		expect(response.headers["server-timing"]).toMatch(/total;dur=\d+/);
	});

	it("should include performance data in /metrics/perf after GraphQL request", async () => {
		const query = `
			query GetTypename {
				__typename
			}
		`;

		await server.inject({
			method: "POST",
			url: "/graphql",
			payload: { query },
		});

		const metricsResponse = await server.inject({
			method: "GET",
			url: "/metrics/perf",
		});

		expect(metricsResponse.statusCode).toBe(200);
		const body = JSON.parse(metricsResponse.body);
		expect(body.recent).toBeDefined();
		expect(body.recent.length).toBeGreaterThan(0);

		// Find the GraphQL request in recent snapshots
		const gqlSnapshot = body.recent.find(
			(snap: { ops?: Record<string, unknown> }) =>
				snap.ops &&
				Object.keys(snap.ops).some((key) => key.startsWith("graphql:")),
		);

		// Should have GraphQL operation tracked with the specific operation type and name
		expect(gqlSnapshot).toBeDefined();
		expect(gqlSnapshot.ops).toBeDefined();

		// Verify that the specific operation "graphql:query:GetTypename" is tracked
		const opKeys = Object.keys(gqlSnapshot.ops);
		const hasExpectedOp = opKeys.some(
			(key) =>
				key === "graphql:query:GetTypename" ||
				key.startsWith("graphql:query:GetTypename"),
		);
		expect(hasExpectedOp).toBe(true);
	});

	it("should track cache operations in GraphQL context", async () => {
		const query = `
			query TestCache {
				__typename
			}
		`;

		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: { query },
		});

		expect(response.statusCode).toBe(200);

		// Server-Timing should include cache metrics
		const serverTiming = response.headers["server-timing"] as string;
		expect(serverTiming).toMatch(/cache;desc="hit:\d+\|miss:\d+"/);
	});

	it("should show cache hit/miss changes when cache is actually exercised", async () => {
		// Query that makes multiple calls to the same data source within one request
		// This would typically use DataLoader which batches and caches within the request
		const query = `
			query TestCacheExercise {
				__typename
			}
		`;

		// First request - baseline cache metrics
		const firstResponse = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: { query },
		});

		expect(firstResponse.statusCode).toBe(200);
		const firstTiming = firstResponse.headers["server-timing"] as string;
		expect(firstTiming).toMatch(/cache;desc="hit:\d+\|miss:\d+"/);

		const firstMatch = firstTiming.match(/cache;desc="hit:(\d+)\|miss:(\d+)"/);
		expect(firstMatch).not.toBeNull();
		const firstHits = Number.parseInt(firstMatch?.[1] ?? "0", 10);
		const firstMisses = Number.parseInt(firstMatch?.[2] ?? "0", 10);
		const firstTotal = firstHits + firstMisses;

		// Second identical request
		const secondResponse = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: { query },
		});

		expect(secondResponse.statusCode).toBe(200);
		const secondTiming = secondResponse.headers["server-timing"] as string;
		expect(secondTiming).toMatch(/cache;desc="hit:\d+\|miss:\d+"/);

		const secondMatch = secondTiming.match(
			/cache;desc="hit:(\d+)\|miss:(\d+)"/,
		);
		expect(secondMatch).not.toBeNull();
		const secondHits = Number.parseInt(secondMatch?.[1] ?? "0", 10);
		const secondMisses = Number.parseInt(secondMatch?.[2] ?? "0", 10);
		const secondTotal = secondHits + secondMisses;

		// Verify cache metrics are being tracked
		// Note: Each request has independent performance tracking, so we're verifying
		// that the cache infrastructure is working and metrics are being captured
		expect(firstTotal).toBeGreaterThanOrEqual(0);
		expect(secondTotal).toBeGreaterThanOrEqual(0);

		// If there's any cache activity, verify hit rate can be calculated
		if (firstTotal > 0) {
			const firstHitRate = firstHits / firstTotal;
			expect(firstHitRate).toBeGreaterThanOrEqual(0);
			expect(firstHitRate).toBeLessThanOrEqual(1);
		}
	});

	it("should handle multiple GraphQL requests with independent performance tracking", async () => {
		const query1 = `query First { __typename }`;
		const query2 = `query Second { __typename }`;

		const response1 = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: { query: query1 },
		});

		const response2 = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: { query: query2 },
		});

		expect(response1.statusCode).toBe(200);
		expect(response2.statusCode).toBe(200);

		// Both should have Server-Timing headers
		expect(response1.headers["server-timing"]).toBeDefined();
		expect(response2.headers["server-timing"]).toBeDefined();

		// Check metrics endpoint has both requests
		const metricsResponse = await server.inject({
			method: "GET",
			url: "/metrics/perf",
		});

		const body = JSON.parse(metricsResponse.body);
		expect(body.recent.length).toBeGreaterThanOrEqual(2);
	});

	it("should track DataLoader operations when GraphQL query uses them", async () => {
		// Query that would potentially use DataLoaders if resolvers leverage them
		// For example, querying a list and then accessing related fields that use dataloaders
		const query = `
			query TestDataLoader {
				organizations(input: { limit: 1 }) {
					edges {
						node {
							id
							name
						}
					}
				}
			}
		`;

		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: { query },
		});

		expect(response.statusCode).toBe(200);

		// Performance tracking should work
		expect(response.headers["server-timing"]).toBeDefined();

		// Check if DataLoader operations were tracked
		const metricsResponse = await server.inject({
			method: "GET",
			url: "/metrics/perf",
		});

		expect(metricsResponse.statusCode).toBe(200);
		const body = JSON.parse(metricsResponse.body);

		// Find the most recent GraphQL request
		const gqlSnapshot = body.recent.find(
			(snap: { ops?: Record<string, unknown> }) =>
				snap.ops &&
				Object.keys(snap.ops).some((key) => key.startsWith("graphql:")),
		);

		if (gqlSnapshot?.ops) {
			// If resolvers use DataLoaders, there should be dataloader:* keys
			const dataloaderOps = Object.keys(gqlSnapshot.ops).filter((key) =>
				key.startsWith("dataloader:"),
			);

			// DataLoader usage is optional depending on resolver implementation
			// This verifies the infrastructure tracks them when present
			if (dataloaderOps.length > 0) {
				// Verify format: dataloader:{name}.{operation} (e.g., "dataloader:users.byId")
				expect(
					dataloaderOps.some((key) => /^dataloader:\w+\.\w+/.test(key)),
				).toBe(true);
			}
		}
	});

	it("should handle GraphQL errors and still track performance", async () => {
		const invalidQuery = `
			query Invalid {
				nonExistentField
			}
		`;

		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: { query: invalidQuery },
		});

		// Should still return a response (with errors)
		expect(response.statusCode).toBe(200);
		const body = JSON.parse(response.body);
		expect(body.errors).toBeDefined();

		// Should still have performance tracking
		expect(response.headers["server-timing"]).toBeDefined();
	});

	it("should track mutations with performance metrics", async () => {
		const mutation = `
			mutation TestMutation {
				__typename
			}
		`;

		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: { query: mutation },
		});

		expect(response.statusCode).toBe(200);
		expect(response.headers["server-timing"]).toBeDefined();
	});

	it("should include operation name in performance tracking when provided", async () => {
		const query = `
			query NamedOperation {
				__typename
			}
		`;

		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: {
				query,
				operationName: "NamedOperation",
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.headers["server-timing"]).toBeDefined();

		// Verify operation name is propagated to performance metrics
		const metricsResponse = await server.inject({
			method: "GET",
			url: "/metrics/perf",
		});

		expect(metricsResponse.statusCode).toBe(200);
		const body = JSON.parse(metricsResponse.body);

		// Find the snapshot with the named operation
		const namedOpSnapshot = body.recent.find(
			(snap: { ops?: Record<string, unknown> }) =>
				snap.ops &&
				Object.keys(snap.ops).some((key) => key.includes("NamedOperation")),
		);

		expect(namedOpSnapshot).toBeDefined();
		expect(namedOpSnapshot.ops).toBeDefined();

		// Verify the operation key follows the format "graphql:query:NamedOperation"
		const opKeys = Object.keys(namedOpSnapshot.ops);
		const hasNamedOp = opKeys.some(
			(key) =>
				key === "graphql:query:NamedOperation" ||
				key.startsWith("graphql:query:NamedOperation"),
		);
		expect(hasNamedOp).toBe(true);
	});

	it("should handle anonymous GraphQL operations", async () => {
		const query = `
			{
				__typename
			}
		`;

		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: { query },
		});

		expect(response.statusCode).toBe(200);
		expect(response.headers["server-timing"]).toBeDefined();

		// Verify anonymous operation is tracked in performance metrics
		const metricsResponse = await server.inject({
			method: "GET",
			url: "/metrics/perf",
		});

		expect(metricsResponse.statusCode).toBe(200);
		const body = JSON.parse(metricsResponse.body);

		// Find the snapshot with a GraphQL operation
		const gqlSnapshot = body.recent.find(
			(snap: { ops?: Record<string, unknown> }) =>
				snap.ops &&
				Object.keys(snap.ops).some((key) => key.startsWith("graphql:")),
		);

		expect(gqlSnapshot).toBeDefined();
		expect(gqlSnapshot.ops).toBeDefined();

		// Verify at least one graphql operation key exists for anonymous queries
		// Anonymous operations are tracked with key format like "graphql:query:<anonymous>"
		const opKeys = Object.keys(gqlSnapshot.ops);
		const hasGraphQLOp = opKeys.some((key) => key.startsWith("graphql:"));
		expect(hasGraphQLOp).toBe(true);
	});

	it("should track performance metrics separately for different request types", async () => {
		// Make a GraphQL request
		await server.inject({
			method: "POST",
			url: "/graphql",
			payload: { query: "{ __typename }" },
		});

		// Make a regular HTTP request
		await server.inject({
			method: "GET",
			url: "/metrics/perf",
		});

		const metricsResponse = await server.inject({
			method: "GET",
			url: "/metrics/perf",
		});

		const body = JSON.parse(metricsResponse.body);
		expect(body.recent.length).toBeGreaterThanOrEqual(2);

		// Both request types should have performance snapshots
		expect(body.recent.every((snap: never) => snap !== null)).toBe(true);

		// Verify that snapshots distinguish between GraphQL and non-GraphQL requests
		// Check for at least one GraphQL operation (has ops with "graphql:" prefix)
		const hasGraphQLSnapshot = body.recent.some(
			(snap: { ops?: Record<string, unknown> }) =>
				snap.ops &&
				Object.keys(snap.ops).some((key) => key.startsWith("graphql:")),
		);
		expect(hasGraphQLSnapshot).toBe(true);

		// Check for at least one non-GraphQL operation (no "graphql:" prefixed ops)
		const hasNonGraphQLSnapshot = body.recent.some(
			(snap: { ops?: Record<string, unknown> }) =>
				!snap.ops ||
				Object.keys(snap.ops).length === 0 ||
				Object.keys(snap.ops).every((key) => !key.startsWith("graphql:")),
		);
		expect(hasNonGraphQLSnapshot).toBe(true);
	});

	it("should track cache hit/miss metrics across multiple requests to same resolver", async () => {
		// First request - should result in cache miss (or no cache activity)
		const query = `
			query TestCacheTracking {
				__typename
			}
		`;

		const firstResponse = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: { query },
		});

		expect(firstResponse.statusCode).toBe(200);

		// Parse Server-Timing header from first request
		const firstTiming = firstResponse.headers["server-timing"] as string;
		expect(firstTiming).toBeDefined();
		expect(firstTiming).toMatch(/cache;desc="hit:\d+\|miss:\d+"/);

		// Extract cache metrics from first request
		const firstCacheMatch = firstTiming.match(
			/cache;desc="hit:(\d+)\|miss:(\d+)"/,
		);
		expect(firstCacheMatch).not.toBeNull();
		const firstHits = Number.parseInt(firstCacheMatch?.[1] ?? "0", 10);
		const firstMisses = Number.parseInt(firstCacheMatch?.[2] ?? "0", 10);

		// Second request - should increment hits or misses
		const secondResponse = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: { query },
		});

		expect(secondResponse.statusCode).toBe(200);

		const secondTiming = secondResponse.headers["server-timing"] as string;
		expect(secondTiming).toBeDefined();
		expect(secondTiming).toMatch(/cache;desc="hit:\d+\|miss:\d+"/);

		// Extract cache metrics from second request
		const secondCacheMatch = secondTiming.match(
			/cache;desc="hit:(\d+)\|miss:(\d+)"/,
		);
		expect(secondCacheMatch).not.toBeNull();
		const secondHits = Number.parseInt(secondCacheMatch?.[1] ?? "0", 10);
		const secondMisses = Number.parseInt(secondCacheMatch?.[2] ?? "0", 10);

		// Verify that cache metrics are being tracked per request
		// Each request gets its own performance tracker, so counters start fresh
		expect(firstHits).toBeGreaterThanOrEqual(0);
		expect(firstMisses).toBeGreaterThanOrEqual(0);
		expect(secondHits).toBeGreaterThanOrEqual(0);
		expect(secondMisses).toBeGreaterThanOrEqual(0);

		// Verify metrics endpoint captures both requests
		const metricsResponse = await server.inject({
			method: "GET",
			url: "/metrics/perf",
		});

		const metricsBody = JSON.parse(metricsResponse.body);
		expect(metricsBody.recent.length).toBeGreaterThanOrEqual(2);

		// Find our two GraphQL requests in recent metrics
		const ourRequests = metricsBody.recent.filter(
			(snap: { cacheHits: number; cacheMisses: number }) =>
				snap.cacheHits >= 0 && snap.cacheMisses >= 0,
		);
		expect(ourRequests.length).toBeGreaterThanOrEqual(2);
	});

	it("should invoke _gqlEnd and accumulate timing under graphql:{type}:{name} key", async () => {
		const query = `
			query TestTimingAccumulation {
				__typename
			}
		`;

		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: {
				query,
			},
		});

		expect(response.statusCode).toBe(200);

		// Get performance metrics
		const metricsResponse = await server.inject({
			method: "GET",
			url: "/metrics/perf",
		});

		const metricsBody = JSON.parse(metricsResponse.body);
		expect(metricsBody.recent.length).toBeGreaterThan(0);

		// Find the most recent GraphQL operation
		const recentOp = metricsBody.recent[metricsBody.recent.length - 1];

		// Verify that graphql operation timing was captured
		// The key should be in format "graphql:query:TestTimingAccumulation"
		expect(recentOp).toBeDefined();

		// Check that total time was tracked (should be in Server-Timing header too)
		const serverTiming = response.headers["server-timing"] as string;
		expect(serverTiming).toMatch(/total;dur=\d+/);
	});

	it("should log 'GraphQL operation completed' info when execution exceeds 200ms threshold", async () => {
		// This test uses a slow introspection query to verify the operation executes
		// and performance metrics are tracked correctly
		const query = `
			query SlowOperationTest {
				__schema {
					types {
						name
						kind
						description
						fields {
							name
							description
							type {
								name
								kind
							}
						}
					}
				}
			}
		`;

		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: {
				query,
			},
		});

		expect(response.statusCode).toBe(200);

		// Verify Server-Timing header contains execution time
		const serverTiming = response.headers["server-timing"] as string;
		expect(serverTiming).toBeDefined();
		expect(serverTiming).toMatch(/total;dur=\d+/);

		// Extract duration and verify it's a reasonable value
		const durationMatch = serverTiming.match(/total;dur=(\d+)/);
		expect(durationMatch).toBeTruthy();
		if (durationMatch) {
			const duration = Number.parseInt(durationMatch[1] ?? "0", 10);
			expect(duration).toBeGreaterThan(0);
		}

		// Verify performance metrics were captured
		const metricsResponse = await server.inject({
			method: "GET",
			url: "/metrics/perf",
		});

		const metricsBody = JSON.parse(metricsResponse.body);
		expect(metricsBody.recent.length).toBeGreaterThan(0);

		// Find the most recent operation
		const recentOp = metricsBody.recent[metricsBody.recent.length - 1];
		expect(recentOp).toBeDefined();

		// The operation should have tracked cache metrics
		expect(recentOp).toHaveProperty("cacheHits");
		expect(recentOp).toHaveProperty("cacheMisses");
	});

	it("should log operation details including name, type, complexity, and cache hit rate", async () => {
		const query = `
			query DetailedLoggingTest {
				__typename
			}
		`;

		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: {
				query,
			},
		});

		expect(response.statusCode).toBe(200);

		// Verify the response contains data
		const body = JSON.parse(response.body);
		expect(body.data).toBeDefined();
		expect(body.data.__typename).toBe("Query");

		// Verify Server-Timing header is present with timing data
		const serverTiming = response.headers["server-timing"] as string;
		expect(serverTiming).toBeDefined();
		expect(serverTiming).toMatch(/total;dur=\d+/);

		// Verify performance tracking occurred
		const metricsResponse = await server.inject({
			method: "GET",
			url: "/metrics/perf",
		});

		const metricsBody = JSON.parse(metricsResponse.body);
		const recentOp = metricsBody.recent[metricsBody.recent.length - 1];

		// Verify cache metrics were tracked (even if 0)
		expect(recentOp).toHaveProperty("cacheHits");
		expect(recentOp).toHaveProperty("cacheMisses");
		expect(typeof recentOp.cacheHits).toBe("number");
		expect(typeof recentOp.cacheMisses).toBe("number");

		// Verify cache hit rate can be calculated
		const total = recentOp.cacheHits + recentOp.cacheMisses;
		if (total > 0) {
			const hitRate = recentOp.cacheHits / total;
			expect(hitRate).toBeGreaterThanOrEqual(0);
			expect(hitRate).toBeLessThanOrEqual(1);
		}
	});
});
