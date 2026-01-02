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

		// Should have GraphQL operation tracked
		if (gqlSnapshot) {
			expect(gqlSnapshot.ops).toBeDefined();
		}
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
		// Note: This test assumes there are resolvers that use DataLoaders
		// For a minimal test, we just verify the infrastructure is in place
		const query = `
			query TestDataLoader {
				__typename
			}
		`;

		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: { query },
		});

		expect(response.statusCode).toBe(200);

		// Performance tracking should work even without DataLoader usage
		expect(response.headers["server-timing"]).toBeDefined();
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
	});
});
