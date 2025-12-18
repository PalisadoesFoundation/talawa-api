import Fastify, { type FastifyInstance } from "fastify";
import Mercurius from "mercurius";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Venue as VenueType } from "~/src/graphql/types/Venue/Venue";

// Mock sanitizer to verify it's used and to provide deterministic output
vi.mock("~/src/utilities/sanitizer", () => ({
	escapeHTML: vi.fn((str: string) => `escaped_${str}`),
}));

describe("Venue GraphQL Integration", () => {
	let app: FastifyInstance;
	let builder: typeof import("~/src/graphql/builder").builder;
	let Venue: typeof import("~/src/graphql/types/Venue/Venue").Venue;

	beforeEach(async () => {
		vi.resetModules();
		const builderModule = await import("~/src/graphql/builder");
		builder = builderModule.builder;
		const VenueModule = await import("~/src/graphql/types/Venue/Venue");
		Venue = VenueModule.Venue;
	});

	afterEach(async () => {
		if (app) {
			await app.close();
		}
	});

	/**
	 * Integration test to verify that the Venue type correctly applies XSS sanitization
	 * to its fields. This avoids fragile mocking of Pothos internals by building
	 * a real schema and executing queries against it.
	 */
	it("should escape name and description fields in the schema", async () => {
		// Setup a temporary schema with a Query type to expose the Venue object
		if (!builder.configStore.typeConfigs.has("Query")) {
			builder.queryType({});
		}

		builder.queryField("testVenue", (t) =>
			t.field({
				type: Venue,
				resolve: (_root, _args, _ctx) => {
					return {
						id: "venue-123",
						name: "Test <script>alert('xss')</script>",
						description: "Description <script>alert('xss')</script>",
						capacity: 500,
						organizationId: "org-1",
						createdAt: new Date(),
						updatedAt: new Date(),
						creatorId: null,
						updaterId: null,
						attachments: [],
					} as VenueType;
				},
			}),
		);

		builder.queryField("testVenueNullDescription", (t) =>
			t.field({
				type: Venue,
				resolve: (_root, _args, _ctx) => {
					return {
						id: "venue-456",
						name: "Venue No Desc",
						description: null,
						capacity: 100,
						organizationId: "org-1",
						createdAt: new Date(),
						updatedAt: new Date(),
						creatorId: null,
						updaterId: null,
						attachments: [],
					} as VenueType;
				},
			}),
		);

		builder.queryField("testVenueEmptyDescription", (t) =>
			t.field({
				type: Venue,
				resolve: (_root, _args, _ctx) => {
					return {
						id: "venue-789",
						name: "Venue Empty Desc",
						description: "",
						capacity: 100,
						organizationId: "org-1",
						createdAt: new Date(),
						updatedAt: new Date(),
						creatorId: null,
						updaterId: null,
						attachments: [],
					} as VenueType;
				},
			}),
		);

		const schema = builder.toSchema();

		// 2. Setup Fastify with Mercurius
		app = Fastify();
		await app.register(Mercurius, {
			schema,
		});

		// 3. Execute Query 1: Check escaping
		const query1 = `
			query {
				testVenue {
					name
					description
				}
			}
		`;

		const result1 = await app.graphql(query1);

		expect(result1.errors).toBeUndefined();
		expect(result1.data).toEqual({
			testVenue: {
				name: "escaped_Test <script>alert('xss')</script>",
				description: "escaped_Description <script>alert('xss')</script>",
			},
		});

		// 4. Execute Query 2: Check null handling
		const query2 = `
			query {
				testVenueNullDescription {
					name
					description
				}
			}
		`;

		const result2 = await app.graphql(query2);

		expect(result2.errors).toBeUndefined();
		expect(result2.data).toEqual({
			testVenueNullDescription: {
				name: "escaped_Venue No Desc",
				description: null,
			},
		});

		// 5. Execute Query 3: Check empty string handling
		const query3 = `
			query {
				testVenueEmptyDescription {
					name
					description
				}
			}
		`;

		const result3 = await app.graphql(query3);

		expect(result3.errors).toBeUndefined();
		expect(result3.data).toEqual({
			testVenueEmptyDescription: {
				name: "escaped_Venue Empty Desc",
				description: "escaped_",
			},
		});
	});
});
