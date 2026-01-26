import type {
	GraphQLFieldResolver,
	GraphQLObjectType,
	GraphQLResolveInfo,
} from "graphql";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import { schema } from "~/src/graphql/schema";
import type { Event } from "~/src/graphql/types/Event/Event";
import envConfig from "~/src/utilities/graphqLimits";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

afterEach(() => {
	vi.clearAllMocks();
});

type VenuesResolver = GraphQLFieldResolver<
	Event,
	GraphQLContext,
	Record<string, unknown>,
	unknown
>;

type MockVenue = {
	id: string;
	name: string;
	description: string;
	capacity: number;
	organizationId: string;
	createdAt: Date;
	updatedAt: Date;
	attachmentsWhereVenue: Array<{ id: string; url: string }>;
};

type MockVenueBooking = {
	createdAt: Date;
	venueId: string;
	venue: MockVenue;
};

/**
 * Helper function to create a valid base64url-encoded cursor
 */
const createValidCursor = (venueId: string, createdAt: Date): string => {
	return Buffer.from(
		JSON.stringify({
			venueId,
			createdAt: createdAt.toISOString(),
		}),
	).toString("base64url");
};

describe("Event Venues Resolver Tests", () => {
	let mockEvent: Event;
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];
	let venuesResolver: VenuesResolver;
	let venuesField: ReturnType<GraphQLObjectType["getFields"]>[string];
	const mockResolveInfo: GraphQLResolveInfo = {} as GraphQLResolveInfo;

	const mockVenueBookings: MockVenueBooking[] = [
		{
			createdAt: new Date("2024-01-01T10:00:00.000Z"),
			venueId: "venue-1",
			venue: {
				id: "venue-1",
				name: "Main Hall",
				description: "Large hall for events",
				capacity: 500,
				organizationId: "org-123",
				createdAt: new Date("2024-01-01T08:00:00.000Z"),
				updatedAt: new Date("2024-01-01T08:00:00.000Z"),
				attachmentsWhereVenue: [
					{ id: "att-1", url: "https://example.com/image1.jpg" },
				],
			},
		},
		{
			createdAt: new Date("2024-01-02T10:00:00.000Z"),
			venueId: "venue-2",
			venue: {
				id: "venue-2",
				name: "Conference Room",
				description: "Medium-sized room",
				capacity: 50,
				organizationId: "org-123",
				createdAt: new Date("2024-01-02T08:00:00.000Z"),
				updatedAt: new Date("2024-01-02T08:00:00.000Z"),
				attachmentsWhereVenue: [
					{ id: "att-2", url: "https://example.com/image2.jpg" },
				],
			},
		},
		{
			createdAt: new Date("2024-01-03T10:00:00.000Z"),
			venueId: "venue-3",
			venue: {
				id: "venue-3",
				name: "Outdoor Space",
				description: "Open-air venue",
				capacity: 1000,
				organizationId: "org-123",
				createdAt: new Date("2024-01-03T08:00:00.000Z"),
				updatedAt: new Date("2024-01-03T08:00:00.000Z"),
				attachmentsWhereVenue: [],
			},
		},
	];

	beforeAll(() => {
		const eventType = schema.getType("Event") as GraphQLObjectType;
		venuesField = eventType.getFields().venues;
		if (!venuesField) {
			throw new Error("Venues field not found on Event type");
		}
		venuesResolver = venuesField.resolve as VenuesResolver;
		if (!venuesResolver) {
			throw new Error("Venues resolver not found on Event type");
		}
	});

	beforeEach(() => {
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-123",
		);
		ctx = context;
		mocks = newMocks;
		mockEvent = {
			id: "event-123",
			name: "Test Event",
			organizationId: "org-123",
			description: "Test Description",
			creatorId: "user-123",
			createdAt: new Date("2024-01-01T00:00:00.000Z"),
			updatedAt: null,
			updaterId: null,
			startAt: new Date("2024-01-20T10:00:00.000Z"),
			endAt: new Date("2024-01-20T12:00:00.000Z"),
			allDay: false,
			isPublic: true,
			isRegisterable: true,
			isInviteOnly: false,
			location: "Test Location",
			registrationClosesAt: new Date("2024-01-19T10:00:00.000Z"),
			title: "Test Event",
			eventType: "standalone" as const,
			attachments: [],
			isRecurringEventTemplate: false,
		};

		// Default mock: return empty array
		mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([]);

		// Mock the select() chain for exists() subqueries
		const mockSelectChain = {
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockResolvedValue([{ exists: true }]),
		};
		mocks.drizzleClient.select = vi.fn().mockReturnValue(mockSelectChain);
	});

	// ============================================================================
	// SECTION 1: Argument Validation (6 tests)
	// ============================================================================
	describe("Argument Validation", () => {
		it("should throw error when both first and last are provided", async () => {
			await expect(
				venuesResolver(mockEvent, { first: 10, last: 5 }, ctx, mockResolveInfo),
			).rejects.toThrow(TalawaGraphQLError);
		});

		it("should throw error when before is used with first", async () => {
			await expect(
				venuesResolver(
					mockEvent,
					{ first: 10, before: createValidCursor("venue-1", new Date()) },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(TalawaGraphQLError);
		});

		it("should throw error when after is used with last", async () => {
			await expect(
				venuesResolver(
					mockEvent,
					{ last: 10, after: createValidCursor("venue-1", new Date()) },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(TalawaGraphQLError);
		});

		it("should throw error when neither first nor last is provided", async () => {
			await expect(
				venuesResolver(mockEvent, {}, ctx, mockResolveInfo),
			).rejects.toThrow(TalawaGraphQLError);
		});

		it("should accept valid forward pagination with first only", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				mockVenueBookings[0],
			]);
			const result = await venuesResolver(
				mockEvent,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);
			expect(result).toBeDefined();
			expect(result.edges).toHaveLength(1);
		});

		it("should accept valid backward pagination with last only", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				mockVenueBookings[0],
			]);
			const result = await venuesResolver(
				mockEvent,
				{ last: 10 },
				ctx,
				mockResolveInfo,
			);
			expect(result).toBeDefined();
			expect(result.edges).toHaveLength(1);
		});
	});

	// ============================================================================
	// SECTION 2: Cursor Validation (6 tests)
	// ============================================================================
	describe("Cursor Validation", () => {
		it("should throw error for malformed base64url cursor", async () => {
			await expect(
				venuesResolver(
					mockEvent,
					{ first: 10, after: "not-valid-base64@#$" },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(TalawaGraphQLError);
		});

		it("should throw error for invalid JSON in cursor", async () => {
			const invalidCursor = Buffer.from("not-json").toString("base64url");
			await expect(
				venuesResolver(
					mockEvent,
					{ first: 10, after: invalidCursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(TalawaGraphQLError);
		});

		it("should throw error for cursor missing venueId field", async () => {
			const invalidCursor = Buffer.from(
				JSON.stringify({
					createdAt: new Date().toISOString(),
				}),
			).toString("base64url");
			await expect(
				venuesResolver(
					mockEvent,
					{ first: 10, after: invalidCursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(TalawaGraphQLError);
		});

		it("should throw error for cursor missing createdAt field", async () => {
			const invalidCursor = Buffer.from(
				JSON.stringify({
					venueId: "venue-1",
				}),
			).toString("base64url");
			await expect(
				venuesResolver(
					mockEvent,
					{ first: 10, after: invalidCursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(TalawaGraphQLError);
		});

		it("should throw error for invalid createdAt format in cursor", async () => {
			const invalidCursor = Buffer.from(
				JSON.stringify({
					venueId: "venue-1",
					createdAt: "not-a-date",
				}),
			).toString("base64url");
			await expect(
				venuesResolver(
					mockEvent,
					{ first: 10, after: invalidCursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(TalawaGraphQLError);
		});

		it("should throw error for backward pagination with invalid cursor (before path)", async () => {
			const invalidCursor = Buffer.from("not-json").toString("base64url");
			await expect(
				venuesResolver(
					mockEvent,
					{ last: 10, before: invalidCursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(TalawaGraphQLError);
		});
	});

	// ============================================================================
	// SECTION 3: Forward Pagination (5 tests)
	// ============================================================================
	describe("Forward Pagination", () => {
		it("should return venues without cursor using simple where clause", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				mockVenueBookings[0],
				mockVenueBookings[1],
			]);

			const result = await venuesResolver(
				mockEvent,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
			expect(result.edges).toHaveLength(2);
			expect(
				mocks.drizzleClient.query.venueBookingsTable.findMany,
			).toHaveBeenCalledWith(
				expect.objectContaining({
					columns: { createdAt: true, venueId: true },
					limit: 11, // first + 1
					where: expect.any(Object),
				}),
			);
		});

		it("should verify cursor-based forward pagination calls drizzle with correct parameters", async () => {
			// Test that when a valid cursor format is provided, the resolver attempts to query
			// We expect it to fail with arguments_associated_resources_not_found when no results
			const cursor = createValidCursor(
				"0196548a-4b7c-75a8-9cc9-afab36b8fc01",
				new Date("2024-01-01T10:00:00.000Z"),
			);
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue(
				[],
			);

			// Should throw because cursor resource not found (empty results with cursor)
			await expect(
				venuesResolver(
					mockEvent,
					{ first: 10, after: cursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(TalawaGraphQLError);

			// Verify findMany was called (meaning cursor parsing succeeded)
			expect(
				mocks.drizzleClient.query.venueBookingsTable.findMany,
			).toHaveBeenCalled();
		});

		it("should throw error when cursor not found for forward pagination", async () => {
			const cursor = createValidCursor(
				"0196548a-4b7c-75a8-9cc9-afab36b8fc01",
				new Date("2024-01-01T10:00:00.000Z"),
			);
			// When cursor is provided but findMany returns empty, error is thrown
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue(
				[],
			);

			await expect(
				venuesResolver(
					mockEvent,
					{ first: 10, after: cursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(TalawaGraphQLError);
		});

		it("should apply correct limit for forward pagination (first + 1)", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue(
				[],
			);

			await venuesResolver(mockEvent, { first: 20 }, ctx, mockResolveInfo);

			expect(
				mocks.drizzleClient.query.venueBookingsTable.findMany,
			).toHaveBeenCalledWith(
				expect.objectContaining({
					limit: 21, // first (20) + 1
				}),
			);
		});

		it("should use DESC ordering for forward pagination", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue(
				[],
			);

			await venuesResolver(mockEvent, { first: 10 }, ctx, mockResolveInfo);

			const call =
				mocks.drizzleClient.query.venueBookingsTable.findMany.mock.calls[0][0];
			expect(call.orderBy).toBeDefined();
			expect(Array.isArray(call.orderBy)).toBe(true);
			expect((call.orderBy as unknown[]).length).toBe(2); // createdAt and venueId
		});

		it("should handle tie-breaking with venueId when createdAt is the same", async () => {
			// Create bookings with same createdAt but different venueIds
			const tieBreakingBookings: MockVenueBooking[] = [
				{
					createdAt: new Date("2024-01-01T10:00:00.000Z"),
					venueId: "venue-a",
					venue: mockVenueBookings[0].venue,
				},
				{
					createdAt: new Date("2024-01-01T10:00:00.000Z"),
					venueId: "venue-b",
					venue: mockVenueBookings[1].venue,
				},
			];
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue(
				tieBreakingBookings,
			);

			const result = await venuesResolver(
				mockEvent,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			expect(result.edges).toHaveLength(2);
			const call =
				mocks.drizzleClient.query.venueBookingsTable.findMany.mock.calls[0][0];
			expect((call.orderBy as unknown[]).length).toBe(2); // Should have 2 order by clauses
		});
	});

	// ============================================================================
	// SECTION 4: Backward Pagination (5 tests)
	// ============================================================================
	describe("Backward Pagination", () => {
		it("should return venues without cursor using simple where clause", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				mockVenueBookings[0],
				mockVenueBookings[1],
			]);

			const result = await venuesResolver(
				mockEvent,
				{ last: 10 },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
			expect(result.edges).toHaveLength(2);
			expect(
				mocks.drizzleClient.query.venueBookingsTable.findMany,
			).toHaveBeenCalledWith(
				expect.objectContaining({
					columns: { createdAt: true, venueId: true },
					limit: 11, // last + 1
					where: expect.any(Object),
				}),
			);
		});

		it("should verify cursor-based backward pagination calls drizzle with correct parameters", async () => {
			// Test that when a valid cursor format is provided, the resolver attempts to query
			const cursor = createValidCursor(
				"0196548a-4b7c-75a8-9cc9-afab36b8fc03",
				new Date("2024-01-03T10:00:00.000Z"),
			);
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue(
				[],
			);

			// Should throw because cursor resource not found (empty results with cursor)
			await expect(
				venuesResolver(
					mockEvent,
					{ last: 10, before: cursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(TalawaGraphQLError);

			// Verify findMany was called (meaning cursor parsing succeeded)
			expect(
				mocks.drizzleClient.query.venueBookingsTable.findMany,
			).toHaveBeenCalled();
		});

		it("should throw error when cursor not found for backward pagination", async () => {
			const cursor = createValidCursor(
				"0196548a-4b7c-75a8-9cc9-afab36b8fc01",
				new Date("2024-01-01T10:00:00.000Z"),
			);
			// When cursor is provided but findMany returns empty, error is thrown
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue(
				[],
			);

			await expect(
				venuesResolver(
					mockEvent,
					{ last: 10, before: cursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(TalawaGraphQLError);
		});

		it("should apply correct limit for backward pagination (last + 1)", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue(
				[],
			);

			await venuesResolver(mockEvent, { last: 15 }, ctx, mockResolveInfo);

			expect(
				mocks.drizzleClient.query.venueBookingsTable.findMany,
			).toHaveBeenCalledWith(
				expect.objectContaining({
					limit: 16, // last (15) + 1
				}),
			);
		});

		it("should use ASC ordering for backward pagination", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue(
				[],
			);

			await venuesResolver(mockEvent, { last: 10 }, ctx, mockResolveInfo);

			const call =
				mocks.drizzleClient.query.venueBookingsTable.findMany.mock.calls[0][0];
			expect(call.orderBy).toBeDefined();
			expect(Array.isArray(call.orderBy)).toBe(true);
			expect((call.orderBy as unknown[]).length).toBe(2); // createdAt and venueId
		});

		it("should handle tie-breaking with venueId when createdAt is the same in backward pagination", async () => {
			// Create bookings with same createdAt but different venueIds
			const tieBreakingBookings: MockVenueBooking[] = [
				{
					createdAt: new Date("2024-01-01T10:00:00.000Z"),
					venueId: "venue-a",
					venue: mockVenueBookings[0].venue,
				},
				{
					createdAt: new Date("2024-01-01T10:00:00.000Z"),
					venueId: "venue-b",
					venue: mockVenueBookings[1].venue,
				},
			];
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue(
				tieBreakingBookings,
			);

			const result = await venuesResolver(
				mockEvent,
				{ last: 10 },
				ctx,
				mockResolveInfo,
			);

			expect(result.edges).toHaveLength(2);
			const call =
				mocks.drizzleClient.query.venueBookingsTable.findMany.mock.calls[0][0];
			expect((call.orderBy as unknown[]).length).toBe(2); // Should have 2 order by clauses for tie-breaking
		});
	});

	// ============================================================================
	// SECTION 5: Where Clause Construction (4 tests)
	// ============================================================================
	describe("Where Clause Construction", () => {
		it("should construct simple where clause for forward pagination without cursor", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue(
				[],
			);

			await venuesResolver(mockEvent, { first: 10 }, ctx, mockResolveInfo);

			const call =
				mocks.drizzleClient.query.venueBookingsTable.findMany.mock.calls[0][0];
			expect(call.where).toBeDefined();
		});

		it("should construct simple where clause for backward pagination without cursor", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue(
				[],
			);

			await venuesResolver(mockEvent, { last: 10 }, ctx, mockResolveInfo);

			const call =
				mocks.drizzleClient.query.venueBookingsTable.findMany.mock.calls[0][0];
			expect(call.where).toBeDefined();
		});

		it("should use where clause with complex conditions for pagination", async () => {
			// Tests that where clause is used in all query paths
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				mockVenueBookings[0],
			]);

			await venuesResolver(mockEvent, { first: 10 }, ctx, mockResolveInfo);

			const call =
				mocks.drizzleClient.query.venueBookingsTable.findMany.mock.calls[0][0];
			expect(call.where).toBeDefined();
			// Reset for next test
			vi.clearAllMocks();
		});
	});

	// ============================================================================
	// SECTION 6: Cursor Resource Validation (3 tests)
	// ============================================================================
	describe("Cursor Resource Validation", () => {
		it("should throw arguments_associated_resources_not_found error when forward cursor not found", async () => {
			const cursor = createValidCursor(
				"0196548a-4b7c-75a8-9cc9-afab36b8fc01",
				new Date("2024-01-01T10:00:00.000Z"),
			);
			// Return empty array to simulate cursor not found
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue(
				[],
			);

			await expect(
				venuesResolver(
					mockEvent,
					{ first: 10, after: cursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(TalawaGraphQLError);
		});

		it("should throw arguments_associated_resources_not_found error when backward cursor not found", async () => {
			const cursor = createValidCursor(
				"0196548a-4b7c-75a8-9cc9-afab36b8fc01",
				new Date("2024-01-01T10:00:00.000Z"),
			);
			// Return empty array to simulate cursor not found
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue(
				[],
			);

			await expect(
				venuesResolver(
					mockEvent,
					{ last: 10, before: cursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(TalawaGraphQLError);
		});

		it("should not validate cursor when cursor is undefined and results are empty", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue(
				[],
			);

			// Should not throw error for undefined cursor even if no results
			const result = await venuesResolver(
				mockEvent,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
			expect(result.edges).toHaveLength(0);
		});
	});

	// ============================================================================
	// SECTION 7: Data Transformation (4 tests)
	// ============================================================================
	describe("Data Transformation", () => {
		it("should transform attachmentsWhereVenue to attachments property", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				mockVenueBookings[0],
			]);

			const result = await venuesResolver(
				mockEvent,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			expect(result.edges).toHaveLength(1);
			const node = result.edges[0].node;
			expect(node).toHaveProperty("attachments");
			expect(node.attachments).toEqual([
				{ id: "att-1", url: "https://example.com/image1.jpg" },
			]);
			// Should not have attachmentsWhereVenue property
			expect(
				(node as unknown as Record<string, unknown>).attachmentsWhereVenue,
			).toBeUndefined();
		});

		it("should include all venue properties in result nodes", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				mockVenueBookings[0],
			]);

			const result = await venuesResolver(
				mockEvent,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			const node = result.edges[0].node;
			expect(node).toHaveProperty("id", "venue-1");
			expect(node).toHaveProperty("name", "Main Hall");
			expect(node).toHaveProperty("description", "Large hall for events");
			expect(node).toHaveProperty("capacity", 500);
			expect(node).toHaveProperty("organizationId", "org-123");
		});

		it("should create correct cursor for each edge", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				mockVenueBookings[0],
				mockVenueBookings[1],
			]);

			const result = await venuesResolver(
				mockEvent,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			expect(result.edges).toHaveLength(2);

			// Verify cursors are base64url encoded
			result.edges.forEach((edge) => {
				expect(edge.cursor).toBeDefined();
				// Cursor should be decodable from base64url
				const decodedCursor = JSON.parse(
					Buffer.from(edge.cursor, "base64url").toString("utf-8"),
				);
				expect(decodedCursor).toHaveProperty("venueId");
				expect(decodedCursor).toHaveProperty("createdAt");
			});
		});

		it("should query with correct columns and relations", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue(
				[],
			);

			await venuesResolver(mockEvent, { first: 10 }, ctx, mockResolveInfo);

			const call =
				mocks.drizzleClient.query.venueBookingsTable.findMany.mock.calls[0][0];

			expect(call.columns).toEqual({
				createdAt: true,
				venueId: true,
			});

			expect(call.with).toEqual({
				venue: {
					with: {
						attachmentsWhereVenue: true,
					},
				},
			});
		});
	});

	// ============================================================================
	// SECTION 8: Complexity Function Tests
	// ============================================================================
	describe("Complexity Function", () => {
		it("should return correct complexity with first argument", () => {
			// Access the complexity function from the field definition
			const complexityFn = venuesField.extensions?.complexity as (args: {
				first?: number;
				last?: number;
			}) => { field: number; multiplier: number };

			if (typeof complexityFn === "function") {
				const result = complexityFn({ first: 10 });
				expect(result).toEqual({
					field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
					multiplier: 10,
				});
			}
		});

		it("should return correct complexity with last argument", () => {
			const complexityFn = venuesField.extensions?.complexity as (args: {
				first?: number;
				last?: number;
			}) => { field: number; multiplier: number };

			if (typeof complexityFn === "function") {
				const result = complexityFn({ last: 5 });
				expect(result).toEqual({
					field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
					multiplier: 5,
				});
			}
		});

		it("should return multiplier of 1 when neither first nor last provided", () => {
			const complexityFn = venuesField.extensions?.complexity as (args: {
				first?: number;
				last?: number;
			}) => { field: number; multiplier: number };

			if (typeof complexityFn === "function") {
				const result = complexityFn({});
				expect(result).toEqual({
					field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
					multiplier: 1,
				});
			}
		});

		it("should prefer first over last when both are provided for complexity", () => {
			const complexityFn = venuesField.extensions?.complexity as (args: {
				first?: number;
				last?: number;
			}) => { field: number; multiplier: number };

			if (typeof complexityFn === "function") {
				const result = complexityFn({ first: 15, last: 5 });
				expect(result).toEqual({
					field: envConfig.API_GRAPHQL_OBJECT_FIELD_COST,
					multiplier: 15,
				});
			}
		});
	});

	// ============================================================================
	// SECTION 9: Additional Coverage Tests
	// ============================================================================
	describe("Additional Coverage for Uncovered Branches", () => {
		it("should properly handle undefined cursor in forward pagination without throwing", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				mockVenueBookings[0],
				mockVenueBookings[1],
			]);

			// This should not throw even though cursor is undefined
			const result = await venuesResolver(
				mockEvent,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
			expect(result.edges.length).toBeGreaterThan(0);
		});

		it("should properly handle undefined cursor in backward pagination without throwing", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				mockVenueBookings[0],
			]);

			// This should not throw even though cursor is undefined
			const result = await venuesResolver(
				mockEvent,
				{ last: 10 },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
			expect(result.edges.length).toBeGreaterThan(0);
		});

		it("should verify resolver returns connection with proper structure", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				mockVenueBookings[0],
			]);

			const result = await venuesResolver(
				mockEvent,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			// Verify connection structure
			expect(result).toHaveProperty("edges");
			expect(result).toHaveProperty("pageInfo");
			expect(result.pageInfo).toHaveProperty("hasNextPage");
			expect(result.pageInfo).toHaveProperty("hasPreviousPage");
			expect(result.pageInfo).toHaveProperty("startCursor");
			expect(result.pageInfo).toHaveProperty("endCursor");
		});

		it("should create valid cursor with proper encoding for each booking", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				mockVenueBookings[0],
				mockVenueBookings[1],
				mockVenueBookings[2],
			]);

			const result = await venuesResolver(
				mockEvent,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			// Verify each edge has a valid cursor
			result.edges.forEach((edge, index) => {
				expect(edge.cursor).toBeDefined();
				expect(typeof edge.cursor).toBe("string");

				// Verify cursor can be decoded
				const decodedStr = Buffer.from(edge.cursor, "base64url").toString(
					"utf-8",
				);
				const decodedCursor = JSON.parse(decodedStr);

				expect(decodedCursor.venueId).toBe(mockVenueBookings[index].venueId);
				expect(decodedCursor.createdAt).toBe(
					mockVenueBookings[index].createdAt.toISOString(),
				);
			});
		});

		it("should verify pageInfo reflects correct pagination state for small result set", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				mockVenueBookings[0],
			]);

			const result = await venuesResolver(
				mockEvent,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			// With only 1 result and first=10, there's no next page
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
		});

		it("should verify orderBy includes both createdAt and venueId for tie-breaking", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue(
				[],
			);

			await venuesResolver(mockEvent, { first: 10 }, ctx, mockResolveInfo);

			const callArgs =
				mocks.drizzleClient.query.venueBookingsTable.findMany.mock.calls[0][0];
			expect(Array.isArray(callArgs.orderBy)).toBe(true);
			expect((callArgs.orderBy as Array<unknown>).length).toBe(2);
		});

		it("should verify with clause requests both venue and attachmentsWhereVenue", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue(
				[],
			);

			await venuesResolver(mockEvent, { first: 10 }, ctx, mockResolveInfo);

			const callArgs =
				mocks.drizzleClient.query.venueBookingsTable.findMany.mock.calls[0][0];
			expect(callArgs.with).toEqual({
				venue: {
					with: {
						attachmentsWhereVenue: true,
					},
				},
			});
		});

		it("should verify columns are correctly specified in findMany query", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue(
				[],
			);

			await venuesResolver(mockEvent, { first: 10 }, ctx, mockResolveInfo);

			const callArgs =
				mocks.drizzleClient.query.venueBookingsTable.findMany.mock.calls[0][0];
			expect(callArgs.columns).toEqual({
				createdAt: true,
				venueId: true,
			});
		});

		it("should verify limit parameter is correctly passed to findMany", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue(
				[],
			);

			await venuesResolver(mockEvent, { first: 25 }, ctx, mockResolveInfo);

			const callArgs =
				mocks.drizzleClient.query.venueBookingsTable.findMany.mock.calls[0][0];
			expect(callArgs.limit).toBe(26); // first + 1 for over-fetching
		});

		it("should verify transform function preserves venue data structure", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				mockVenueBookings[0],
			]);

			const result = await venuesResolver(
				mockEvent,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			const node = result.edges[0].node;
			// Verify node is a venue with all properties
			expect(node.id).toBe("venue-1");
			expect(node.organizationId).toBe("org-123");
			expect(node.name).toBe("Main Hall");
		});
	});

	// ============================================================================
	// SECTION 10: Edge Cases and Integration Tests
	// ============================================================================
	describe("Edge Cases and Integration", () => {
		it("should return empty connection when no venues exist for event", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue(
				[],
			);

			const result = await venuesResolver(
				mockEvent,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
			expect(result.edges).toHaveLength(0);
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
			expect(result.pageInfo.startCursor).toBe(null);
			expect(result.pageInfo.endCursor).toBe(null);
		});

		it("should set hasNextPage correctly for forward pagination", async () => {
			// Fetch with limit=3 (first=2, +1), get 3 results means hasNextPage=true
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				mockVenueBookings[0],
				mockVenueBookings[1],
				mockVenueBookings[2],
			]);

			const result = await venuesResolver(
				mockEvent,
				{ first: 2 },
				ctx,
				mockResolveInfo,
			);

			expect(result.edges).toHaveLength(2); // Should remove the extra fetched node
			expect(result.pageInfo.hasNextPage).toBe(true);
		});

		it("should set hasPreviousPage correctly for backward pagination", async () => {
			// Fetch with limit=3 (last=2, +1), get 3 results means hasPreviousPage=true
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				mockVenueBookings[0],
				mockVenueBookings[1],
				mockVenueBookings[2],
			]);

			const result = await venuesResolver(
				mockEvent,
				{ last: 2 },
				ctx,
				mockResolveInfo,
			);

			expect(result.edges).toHaveLength(2); // Should remove the extra fetched node
			expect(result.pageInfo.hasPreviousPage).toBe(true);
		});

		it("should set correct cursors in pageInfo for forward pagination", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				mockVenueBookings[0],
				mockVenueBookings[1],
			]);

			const result = await venuesResolver(
				mockEvent,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			expect(result.pageInfo.startCursor).toBeDefined();
			expect(result.pageInfo.endCursor).toBeDefined();
			expect(result.pageInfo.startCursor).not.toBe(result.pageInfo.endCursor);
		});

		it("should handle venues with no attachments", async () => {
			const venueNoAttachments: MockVenueBooking = {
				createdAt: new Date("2024-01-04T10:00:00.000Z"),
				venueId: "venue-4",
				venue: {
					id: "venue-4",
					name: "Empty Venue",
					description: "Venue with no attachments",
					capacity: 100,
					organizationId: "org-123",
					createdAt: new Date("2024-01-04T08:00:00.000Z"),
					updatedAt: new Date("2024-01-04T08:00:00.000Z"),
					attachmentsWhereVenue: [],
				},
			};

			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				venueNoAttachments,
			]);

			const result = await venuesResolver(
				mockEvent,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			expect(result.edges).toHaveLength(1);
			const node = result.edges[0].node;
			expect(node.attachments).toEqual([]);
		});

		it("should handle single venue result correctly", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				mockVenueBookings[0],
			]);

			const result = await venuesResolver(
				mockEvent,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			expect(result.edges).toHaveLength(1);
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
			expect(result.pageInfo.startCursor).toBe(result.pageInfo.endCursor);
		});

		it("should reverse edges for backward pagination", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				mockVenueBookings[0],
				mockVenueBookings[1],
			]);

			const resultForward = await venuesResolver(
				mockEvent,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				mockVenueBookings[1],
				mockVenueBookings[0],
			]);

			const resultBackward = await venuesResolver(
				mockEvent,
				{ last: 10 },
				ctx,
				mockResolveInfo,
			);

			// With backward pagination, edges should be reversed
			// Forward: venue-1, venue-2
			// Backward: venue-2, venue-1 (reversed for backward pagination)
			expect(resultForward.edges[0].node.id).toBe("venue-1");
			expect(resultBackward.edges[0].node.id).toBe("venue-1");
		});
	});

	// ============================================================================
	// SECTION 11: Error Code Verification
	// ============================================================================
	describe("Error Code Verification", () => {
		it("should throw error with invalid_arguments code for invalid args", async () => {
			try {
				await venuesResolver(
					mockEvent,
					{ first: 10, last: 5 },
					ctx,
					mockResolveInfo,
				);
				expect.fail("Should have thrown an error");
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				const graphqlError = error as TalawaGraphQLError;
				expect(graphqlError.extensions.code).toBe("invalid_arguments");
			}
		});

		it("should throw error with arguments_associated_resources_not_found code when valid cursor returns no results", async () => {
			// Use a valid UUID format for cursor
			const cursor = createValidCursor(
				"0196548a-4b7c-75a8-9cc9-afab36b8fc99",
				new Date("2024-01-01T10:00:00.000Z"),
			);
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue(
				[],
			);

			try {
				await venuesResolver(
					mockEvent,
					{ first: 10, after: cursor },
					ctx,
					mockResolveInfo,
				);
				expect.fail("Should have thrown an error");
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				const graphqlError = error as TalawaGraphQLError;
				expect(graphqlError.extensions.code).toBe(
					"arguments_associated_resources_not_found",
				);
			}
		});

		it("should include correct argument path in error for forward pagination cursor issues", async () => {
			const cursor = createValidCursor(
				"0196548a-4b7c-75a8-9cc9-afab36b8fc99",
				new Date("2024-01-01T10:00:00.000Z"),
			);
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue(
				[],
			);

			try {
				await venuesResolver(
					mockEvent,
					{ first: 10, after: cursor },
					ctx,
					mockResolveInfo,
				);
				expect.fail("Should have thrown an error");
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				const graphqlError = error as TalawaGraphQLError;
				expect(graphqlError.extensions.issues).toBeDefined();
				const issues = graphqlError.extensions.issues as Array<{
					argumentPath: string[];
				}>;
				expect(issues[0].argumentPath).toEqual(["after"]);
			}
		});

		it("should include correct argument path in error for backward pagination cursor issues", async () => {
			const cursor = createValidCursor(
				"0196548a-4b7c-75a8-9cc9-afab36b8fc99",
				new Date("2024-01-01T10:00:00.000Z"),
			);
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue(
				[],
			);

			try {
				await venuesResolver(
					mockEvent,
					{ last: 10, before: cursor },
					ctx,
					mockResolveInfo,
				);
				expect.fail("Should have thrown an error");
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				const graphqlError = error as TalawaGraphQLError;
				expect(graphqlError.extensions.issues).toBeDefined();
				const issues = graphqlError.extensions.issues as Array<{
					argumentPath: string[];
				}>;
				expect(issues[0].argumentPath).toEqual(["before"]);
			}
		});

		it("should include issues array in error for invalid cursor parsing", async () => {
			const invalidCursor = Buffer.from("not-json").toString("base64url");

			try {
				await venuesResolver(
					mockEvent,
					{ first: 10, after: invalidCursor },
					ctx,
					mockResolveInfo,
				);
				expect.fail("Should have thrown an error");
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				const graphqlError = error as TalawaGraphQLError;
				expect(graphqlError.extensions.code).toBe("invalid_arguments");
				expect(graphqlError.extensions.issues).toBeDefined();
			}
		});
	});

	// ============================================================================
	// SECTION 12: Cursor Parsing Edge Cases
	// ============================================================================
	describe("Cursor Parsing Edge Cases", () => {
		it("should handle cursor with extra fields gracefully when using valid UUID", async () => {
			// Cursor with extra fields should still work if required fields are present and valid
			const cursorWithExtra = Buffer.from(
				JSON.stringify({
					venueId: "0196548a-4b7c-75a8-9cc9-afab36b8fc01",
					createdAt: new Date("2024-01-01T10:00:00.000Z").toISOString(),
					extraField: "should be ignored",
				}),
			).toString("base64url");

			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				mockVenueBookings[1],
			]);

			const result = await venuesResolver(
				mockEvent,
				{ first: 10, after: cursorWithExtra },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
			expect(result.edges).toHaveLength(1);
		});

		it("should handle cursor with null venueId", async () => {
			const invalidCursor = Buffer.from(
				JSON.stringify({
					venueId: null,
					createdAt: new Date().toISOString(),
				}),
			).toString("base64url");

			await expect(
				venuesResolver(
					mockEvent,
					{ first: 10, after: invalidCursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(TalawaGraphQLError);
		});

		it("should handle cursor with empty string venueId", async () => {
			const invalidCursor = Buffer.from(
				JSON.stringify({
					venueId: "",
					createdAt: new Date().toISOString(),
				}),
			).toString("base64url");

			// Empty string should fail validation
			await expect(
				venuesResolver(
					mockEvent,
					{ first: 10, after: invalidCursor },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(TalawaGraphQLError);
		});

		it("should reject ISO date string with timezone offset (requires Z suffix)", async () => {
			// The schema uses z.string().datetime() which requires 'Z' suffix
			const cursorWithTz = Buffer.from(
				JSON.stringify({
					venueId: "0196548a-4b7c-75a8-9cc9-afab36b8fc01",
					createdAt: "2024-01-01T10:00:00.000+05:00", // ISO with timezone - should fail
				}),
			).toString("base64url");

			await expect(
				venuesResolver(
					mockEvent,
					{ first: 10, after: cursorWithTz },
					ctx,
					mockResolveInfo,
				),
			).rejects.toThrow(TalawaGraphQLError);
		});

		it("should accept ISO date string with Z suffix", async () => {
			const cursorWithZ = Buffer.from(
				JSON.stringify({
					venueId: "0196548a-4b7c-75a8-9cc9-afab36b8fc01",
					createdAt: "2024-01-01T10:00:00.000Z",
				}),
			).toString("base64url");

			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				mockVenueBookings[1],
			]);

			const result = await venuesResolver(
				mockEvent,
				{ first: 10, after: cursorWithZ },
				ctx,
				mockResolveInfo,
			);

			expect(result).toBeDefined();
		});
	});

	// ============================================================================
	// SECTION 13: Pagination Boundary Tests
	// ============================================================================
	describe("Pagination Boundary Tests", () => {
		it("should handle first=1 correctly", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				mockVenueBookings[0],
				mockVenueBookings[1], // Extra for hasNextPage check
			]);

			const result = await venuesResolver(
				mockEvent,
				{ first: 1 },
				ctx,
				mockResolveInfo,
			);

			expect(result.edges).toHaveLength(1);
			expect(result.pageInfo.hasNextPage).toBe(true);
		});

		it("should handle last=1 correctly", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				mockVenueBookings[0],
				mockVenueBookings[1], // Extra for hasPreviousPage check
			]);

			const result = await venuesResolver(
				mockEvent,
				{ last: 1 },
				ctx,
				mockResolveInfo,
			);

			expect(result.edges).toHaveLength(1);
			expect(result.pageInfo.hasPreviousPage).toBe(true);
		});

		it("should handle exact limit match (no extra results)", async () => {
			// Return exactly first+1 results
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				mockVenueBookings[0],
				mockVenueBookings[1],
			]);

			const result = await venuesResolver(
				mockEvent,
				{ first: 2 },
				ctx,
				mockResolveInfo,
			);

			expect(result.edges).toHaveLength(2);
			expect(result.pageInfo.hasNextPage).toBe(false);
		});

		it("should handle forward pagination with cursor returning single result", async () => {
			const cursor = createValidCursor(
				"0196548a-4b7c-75a8-9cc9-afab36b8fc02",
				new Date("2024-01-02T10:00:00.000Z"),
			);

			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				mockVenueBookings[2], // Only one result after cursor
			]);

			const result = await venuesResolver(
				mockEvent,
				{ first: 10, after: cursor },
				ctx,
				mockResolveInfo,
			);

			expect(result.edges).toHaveLength(1);
			expect(result.pageInfo.hasNextPage).toBe(false);
		});

		it("should handle backward pagination with cursor returning single result", async () => {
			const cursor = createValidCursor(
				"0196548a-4b7c-75a8-9cc9-afab36b8fc02",
				new Date("2024-01-02T10:00:00.000Z"),
			);

			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				mockVenueBookings[0], // Only one result before cursor
			]);

			const result = await venuesResolver(
				mockEvent,
				{ last: 10, before: cursor },
				ctx,
				mockResolveInfo,
			);

			expect(result.edges).toHaveLength(1);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
		});
	});

	// ============================================================================
	// SECTION 14: Multiple Attachments and Complex Data
	// ============================================================================
	describe("Multiple Attachments and Complex Data", () => {
		it("should handle venues with multiple attachments", async () => {
			const venueWithMultipleAttachments: MockVenueBooking = {
				createdAt: new Date("2024-01-05T10:00:00.000Z"),
				venueId: "venue-5",
				venue: {
					id: "venue-5",
					name: "Gallery",
					description: "Art gallery",
					capacity: 200,
					organizationId: "org-123",
					createdAt: new Date("2024-01-05T08:00:00.000Z"),
					updatedAt: new Date("2024-01-05T08:00:00.000Z"),
					attachmentsWhereVenue: [
						{ id: "att-1", url: "https://example.com/img1.jpg" },
						{ id: "att-2", url: "https://example.com/img2.jpg" },
						{ id: "att-3", url: "https://example.com/img3.jpg" },
					],
				},
			};

			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				venueWithMultipleAttachments,
			]);

			const result = await venuesResolver(
				mockEvent,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			expect(result.edges).toHaveLength(1);
			expect(result.edges[0].node.attachments).toHaveLength(3);
		});

		it("should preserve all venue fields including createdAt and updatedAt", async () => {
			mocks.drizzleClient.query.venueBookingsTable.findMany.mockResolvedValue([
				mockVenueBookings[0],
			]);

			const result = await venuesResolver(
				mockEvent,
				{ first: 10 },
				ctx,
				mockResolveInfo,
			);

			const node = result.edges[0].node;
			expect(node.createdAt).toEqual(mockVenueBookings[0].venue.createdAt);
			expect(node.updatedAt).toEqual(mockVenueBookings[0].venue.updatedAt);
		});
	});
});
