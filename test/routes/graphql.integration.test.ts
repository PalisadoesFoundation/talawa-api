vi.mock("~/src/fastifyPlugins/backgroundWorkers", () => ({
	default: async () => {},
}));

vi.mock("~/src/fastifyPlugins/drizzleClient", () => ({
    default: async () => {},
}));

import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createServer } from "~/src/createServer";

describe("GraphQL Correlation ID Integration", () => {
	let server: FastifyInstance;

	beforeEach(async () => {
		server = await createServer();
		await server.ready();
	});

	afterEach(async () => {
		await server.close();
	});

	it("should include x-correlation-id header in successful GraphQL response", async () => {
		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: {
				query: `
					query {
						__typename
					}
				`,
			},
			headers: {
				"content-type": "application/json",
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.headers["x-correlation-id"]).toBeDefined();
		expect(response.headers["x-correlation-id"]).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
		);

		const body = JSON.parse(response.body);
		expect(body.data).toBeDefined();
		expect(body.data.__typename).toBe("Query");
	});

	it("should include x-correlation-id header in GraphQL error response", async () => {
		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: {
				query: `
					query {
						nonExistentField
					}
				`,
			},
			headers: {
				"content-type": "application/json",
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.headers["x-correlation-id"]).toBeDefined();
		expect(response.headers["x-correlation-id"]).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
		);

		const body = JSON.parse(response.body);
		expect(body.errors).toBeDefined();
		expect(body.errors.length).toBeGreaterThan(0);
		expect(body.errors[0].extensions.correlationId).toBe(
			response.headers["x-correlation-id"],
		);
	});

	it("should use client-provided x-correlation-id when present", async () => {
		const clientCorrelationId = "526e6c07-522a-453f-a436-9ef646d87a1e";

		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: {
				query: `
					query {
						__typename
					}
				`,
			},
			headers: {
				"content-type": "application/json",
				"x-correlation-id": clientCorrelationId,
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.headers["x-correlation-id"]).toBe(clientCorrelationId);

		const body = JSON.parse(response.body);
		expect(body.data).toBeDefined();
	});

	it("should use client-provided x-correlation-id in error extensions", async () => {
		const clientCorrelationId = "526e6c07-522a-453f-a436-9ef646d87a1e";

		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: {
				query: `
					query {
						invalidField
					}
				`,
			},
			headers: {
				"content-type": "application/json",
				"x-correlation-id": clientCorrelationId,
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.headers["x-correlation-id"]).toBe(clientCorrelationId);

		const body = JSON.parse(response.body);
		expect(body.errors).toBeDefined();
		expect(body.errors.length).toBeGreaterThan(0);
		expect(body.errors[0].extensions.correlationId).toBe(clientCorrelationId);
	});

	it("should include correlation ID for syntax errors in GraphQL query", async () => {
		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: {
				query: `
					query {
						__typename
						# Missing closing brace
				`,
			},
			headers: {
				"content-type": "application/json",
			},
		});

		// GraphQL syntax errors still return 200 with errors in body
		expect(response.statusCode).toBe(200);
		expect(response.headers["x-correlation-id"]).toBeDefined();
		expect(response.headers["x-correlation-id"]).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
		);

		const body = JSON.parse(response.body);
		expect(body.errors).toBeDefined();
	});

	it("should include correlation ID for multiple errors in single GraphQL request", async () => {
		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: {
				query: `
					query {
						field1: nonExistent1
						field2: nonExistent2
						field3: nonExistent3
					}
				`,
			},
			headers: {
				"content-type": "application/json",
			},
		});

		expect(response.statusCode).toBe(200);
		const correlationId = response.headers["x-correlation-id"];
		expect(correlationId).toBeDefined();
		expect(correlationId).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
		);

		const body = JSON.parse(response.body);
		expect(body.errors).toBeDefined();
		expect(body.errors.length).toBeGreaterThan(0);

		body.errors.forEach((error: { extensions: { correlationId: string } }) => {
			expect(error.extensions.correlationId).toBe(correlationId);
		});
	});

	it("should maintain correlation ID consistency across mutations", async () => {
		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: {
				query: `
					mutation {
						__typename
					}
				`,
			},
			headers: {
				"content-type": "application/json",
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.headers["x-correlation-id"]).toBeDefined();
		expect(response.headers["x-correlation-id"]).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
		);

		const body = JSON.parse(response.body);
		expect(body.data).toBeDefined();
	});

	it("should include correlation ID for validation errors", async () => {
		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: {
				query: `
					query GetUser($id: String!) {
						__typename
					}
				`,
				variables: {},
			},
			headers: {
				"content-type": "application/json",
			},
		});

		// GraphQL validation errors return 200 with errors in body
		expect(response.statusCode).toBe(200);
		expect(response.headers["x-correlation-id"]).toBeDefined();

		const body = JSON.parse(response.body);
		expect(body.errors).toBeDefined();
		// Validation errors should also have correlation ID in extensions
		expect(body.errors[0].extensions.correlationId).toBe(
			response.headers["x-correlation-id"],
		);
	});

	it("should handle malformed GraphQL requests with correlation ID", async () => {
		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: {
				variables: {},
			},
			headers: {
				"content-type": "application/json",
			},
		});

		// Malformed requests still return 200 in GraphQL spec
		expect(response.statusCode).toBe(200);
		expect(response.headers["x-correlation-id"]).toBeDefined();
		expect(response.headers["x-correlation-id"]).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
		);

		const body = JSON.parse(response.body);
		expect(body.errors).toBeDefined();
	});

	it("should generate unique correlation IDs for concurrent requests", async () => {
		const requests = Array.from({ length: 5 }, () =>
			server.inject({
				method: "POST",
				url: "/graphql",
				payload: {
					query: `query { __typename }`,
				},
				headers: {
					"content-type": "application/json",
				},
			}),
		);

		const responses = await Promise.all(requests);

		const correlationIds = responses.map(
			(r: unknown) =>
				(r as { headers: { [key: string]: string } }).headers[
					"x-correlation-id"
				],
		);

		correlationIds.forEach((id: string | undefined) => {
			expect(id).toBeDefined();
			expect(id).toMatch(
				/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
			);
		});

		const uniqueIds = new Set(correlationIds);
		expect(uniqueIds.size).toBe(correlationIds.length);
	});

	it("should include correlation ID in GraphQL introspection queries", async () => {
		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			payload: {
				query: `
					query IntrospectionQuery {
						__schema {
							queryType {
								name
							}
						}
					}
				`,
			},
			headers: {
				"content-type": "application/json",
			},
		});

		expect(response.statusCode).toBe(200);
		expect(response.headers["x-correlation-id"]).toBeDefined();
		expect(response.headers["x-correlation-id"]).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
		);

		const body = JSON.parse(response.body);
		expect(body.data).toBeDefined();
		expect(body.data.__schema).toBeDefined();
	});
});
