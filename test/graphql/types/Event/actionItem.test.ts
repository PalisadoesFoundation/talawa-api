import { Buffer } from "node:buffer";
import { asc, desc, eq } from "drizzle-orm";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { actionsTable } from "~/src/drizzle/tables/actions";
import type { GraphQLContext } from "~/src/graphql/context";
import { resolveActionItemsPaginated } from "~/src/graphql/types/Event/actionItems";
import type { Event as EventType } from "~/src/graphql/types/Event/Event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Mock data
const mockActionItem1 = {
	id: "01234567-89ab-cdef-0123-456789abcdef",
	assignedAt: new Date("2024-01-01T10:00:00Z"),
	assigneeId: "user-1",
	categoryId: "category-1",
	completionAt: null,
	createdAt: new Date("2024-01-01T09:00:00Z"),
	creatorId: "user-admin",
	eventId: "event-1",
	isCompleted: false,
	organizationId: "org-1",
	postCompletionNotes: null,
	preCompletionNotes: "Initial notes",
	updatedAt: null,
	updaterId: null,
};

const mockActionItem2 = {
	id: "01234567-89ab-cdef-0123-456789abcde2",
	assignedAt: new Date("2024-01-02T10:00:00Z"),
	assigneeId: "user-2",
	categoryId: "category-1",
	completionAt: new Date("2024-01-02T15:00:00Z"),
	createdAt: new Date("2024-01-02T09:00:00Z"),
	creatorId: "user-admin",
	eventId: "event-1",
	isCompleted: true,
	organizationId: "org-1",
	postCompletionNotes: "Task completed successfully",
	preCompletionNotes: "Follow up needed",
	updatedAt: new Date("2024-01-02T14:00:00Z"),
	updaterId: "user-admin",
};

const mockActionItem3 = {
	id: "01234567-89ab-cdef-0123-456789abcde3",
	assignedAt: new Date("2024-01-03T10:00:00Z"),
	assigneeId: "user-3",
	categoryId: "category-2",
	completionAt: null,
	createdAt: new Date("2024-01-03T09:00:00Z"),
	creatorId: "user-admin",
	eventId: "event-2", // Different event
	isCompleted: false,
	organizationId: "org-1",
	postCompletionNotes: null,
	preCompletionNotes: null,
	updatedAt: null,
	updaterId: null,
};

const mockEvent: EventType = {
	id: "event-1",
	name: "Test Event",
	description: "Test event description",
	startAt: new Date("2024-02-01T10:00:00Z"),
	endAt: new Date("2024-02-01T18:00:00Z"),
	allDay: false,
	isPublic: true,
	isRegisterable: true,
	location: "Test Location",
	organizationId: "org-1",
	createdAt: new Date("2024-01-01T00:00:00Z"),
	updatedAt: new Date("2024-01-01T00:00:00Z"),
	creatorId: "user-admin",
	updaterId: null,
	isRecurringEventTemplate: false,
	attachments: [],
};

describe("Event.actionItems resolver", () => {
	let ctx: GraphQLContext;
	let mocks: ReturnType<typeof createMockGraphQLContext>["mocks"];

	beforeEach(() => {
		vi.clearAllMocks();
		const { context, mocks: newMocks } = createMockGraphQLContext(
			true,
			"user-1",
		);
		ctx = context;
		mocks = newMocks;

		// Mock the select method for exists queries
		const mockSelect = {
			from: vi.fn().mockReturnThis(),
			where: vi.fn().mockReturnThis(),
		};
		ctx.drizzleClient.select = vi.fn().mockReturnValue(mockSelect);
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error when user is not authenticated", async () => {
			ctx.currentClient.isAuthenticated = false;

			await expect(
				resolveActionItemsPaginated(mockEvent, { first: 10 }, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				}),
			);
		});

		it("should throw unauthenticated error when user is not found", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				resolveActionItemsPaginated(mockEvent, { first: 10 }, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "unauthenticated",
					},
				}),
			);
		});
	});

	describe("Authorization", () => {
		it("should throw unauthorized_action error when user is not authorized", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				role: "member",
				organizationMembershipsWhereMember: [], // No membership
			});

			await expect(
				resolveActionItemsPaginated(mockEvent, { first: 10 }, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "unauthorized_action",
					},
				}),
			);
		});

		it("should allow global administrator", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			});
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem1,
			]);

			const result = await resolveActionItemsPaginated(
				mockEvent,
				{ first: 10 },
				ctx,
			);

			expect(result).toBeDefined();
			expect(result.edges).toHaveLength(1);
		});

		it("should allow organization administrator", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				role: "member",
				organizationMembershipsWhereMember: [{ role: "administrator" }],
			});
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem1,
			]);

			const result = await resolveActionItemsPaginated(
				mockEvent,
				{ first: 10 },
				ctx,
			);

			expect(result).toBeDefined();
			expect(result.edges).toHaveLength(1);
		});

		it("should allow organization regular member", async () => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				role: "member",
				organizationMembershipsWhereMember: [{ role: "regular" }],
			});
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem1,
			]);

			const result = await resolveActionItemsPaginated(
				mockEvent,
				{ first: 10 },
				ctx,
			);

			expect(result).toBeDefined();
			expect(result.edges).toHaveLength(1);
		});
	});

	describe("Argument Parsing and Validation", () => {
		beforeEach(() => {
			// Setup valid user for argument tests
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			});
		});

		it("should throw error when both first and last are provided", async () => {
			await expect(
				resolveActionItemsPaginated(mockEvent, { first: 10, last: 10 }, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["last"],
								message:
									'Argument "last" cannot be provided with argument "first".',
							}),
						]),
					},
				}),
			);
		});

		it("should throw error when before is provided with first", async () => {
			await expect(
				resolveActionItemsPaginated(
					mockEvent,
					{ first: 10, before: "cursor" },
					ctx,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["before"],
								message:
									'Argument "before" cannot be provided with argument "first".',
							}),
						]),
					},
				}),
			);
		});

		it("should throw error when after is provided with last", async () => {
			await expect(
				resolveActionItemsPaginated(
					mockEvent,
					{ last: 10, after: "cursor" },
					ctx,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["after"],
								message:
									'Argument "after" cannot be provided with argument "last".',
							}),
						]),
					},
				}),
			);
		});

		it("should throw error when neither first nor last is provided", async () => {
			await expect(
				resolveActionItemsPaginated(mockEvent, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["first"],
								message:
									'A non-null value for argument "first" must be provided.',
							}),
							expect.objectContaining({
								argumentPath: ["last"],
								message:
									'A non-null value for argument "last" must be provided.',
							}),
						]),
					},
				}),
			);
		});

		it("should throw error for invalid cursor format", async () => {
			await expect(
				resolveActionItemsPaginated(
					mockEvent,
					{ first: 10, after: "invalid-cursor" },
					ctx,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["after"],
								message: "Not a valid cursor.",
							}),
						]),
					},
				}),
			);
		});

		it("should throw error for cursor with invalid JSON", async () => {
			const invalidJsonCursor = Buffer.from("invalid json", "utf-8").toString(
				"base64url",
			);

			await expect(
				resolveActionItemsPaginated(
					mockEvent,
					{ first: 10, after: invalidJsonCursor },
					ctx,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["after"],
								message: "Not a valid cursor.",
							}),
						]),
					},
				}),
			);
		});

		it("should throw error for cursor missing required fields", async () => {
			const invalidCursor = Buffer.from(
				JSON.stringify({ id: "test-id" }), // Missing assignedAt
				"utf-8",
			).toString("base64url");

			await expect(
				resolveActionItemsPaginated(
					mockEvent,
					{ first: 10, after: invalidCursor },
					ctx,
				),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["after"],
								message: "Not a valid cursor.",
							}),
						]),
					},
				}),
			);
		});

		it("should reject first parameter below minimum", async () => {
			await expect(
				resolveActionItemsPaginated(mockEvent, { first: 0 }, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.any(Array),
					},
				}),
			);
		});

		it("should reject first parameter above maximum", async () => {
			await expect(
				resolveActionItemsPaginated(mockEvent, { first: 33 }, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({
					extensions: {
						code: "invalid_arguments",
						issues: expect.any(Array),
					},
				}),
			);
		});
	});

	describe("Successful Resolution", () => {
		beforeEach(() => {
			// Setup valid admin user
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			});
		});

		it("should return action items connection for the event", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem1,
				mockActionItem2,
			]);

			const result = await resolveActionItemsPaginated(
				mockEvent,
				{ first: 10 },
				ctx,
			);

			expect(result.edges).toHaveLength(2);
			expect(result.edges[0]?.node).toEqual(mockActionItem1);
			expect(result.edges[1]?.node).toEqual(mockActionItem2);
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
		});

		it("should return empty connection when no action items exist", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([]);

			const result = await resolveActionItemsPaginated(
				mockEvent,
				{ first: 10 },
				ctx,
			);

			expect(result.edges).toHaveLength(0);
			expect(result.pageInfo.startCursor).toBeNull();
			expect(result.pageInfo.endCursor).toBeNull();
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
		});

		it("should filter by event ID", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem1,
				mockActionItem2,
			]);

			await resolveActionItemsPaginated(mockEvent, { first: 10 }, ctx);

			const findManyCalls = mocks.drizzleClient.query.actionsTable
				.findMany as ReturnType<typeof vi.fn>;
			expect(findManyCalls).toHaveBeenCalled();

			const callArgs = findManyCalls.mock.calls[0]?.[0];
			expect(callArgs).toBeDefined();
			expect(callArgs).toHaveProperty("where");
			expect(callArgs.where).toEqual(eq(actionsTable.eventId, mockEvent.id));
		});
	});

	describe("Cursor Creation and Handling", () => {
		beforeEach(() => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			});
		});

		it("should create valid base64url cursors", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem1,
			]);

			const result = await resolveActionItemsPaginated(
				mockEvent,
				{ first: 1 },
				ctx,
			);

			const cursor = result.edges[0]?.cursor;
			expect(cursor).toBeTruthy();

			if (cursor) {
				const decoded = JSON.parse(
					Buffer.from(cursor, "base64url").toString("utf-8"),
				);
				expect(decoded).toEqual({
					id: mockActionItem1.id,
					assignedAt: mockActionItem1.assignedAt.toISOString(),
				});
			}
		});

		// Note: Cursor validation tests are removed because this resolver
		// validates cursor existence during argument parsing, making it impossible
		// to test with mocked data. The cursor must exist in the database
		// at argument parsing time.
	});

	describe("Order By Verification", () => {
		beforeEach(() => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			});
		});

		it("should use ascending order for forward pagination", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([]);

			await resolveActionItemsPaginated(mockEvent, { first: 1 }, ctx);

			const findManyCalls = mocks.drizzleClient.query.actionsTable
				.findMany as ReturnType<typeof vi.fn>;
			expect(findManyCalls).toHaveBeenCalled();

			const callArgs = findManyCalls.mock.calls[0]?.[0];
			expect(callArgs).toBeDefined();
			expect(callArgs).toHaveProperty("orderBy");
			expect(callArgs.orderBy).toEqual([
				asc(actionsTable.assignedAt),
				asc(actionsTable.id),
			]);
		});

		it("should use descending order for backward pagination", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([]);

			await resolveActionItemsPaginated(mockEvent, { last: 1 }, ctx);

			const findManyCalls = mocks.drizzleClient.query.actionsTable
				.findMany as ReturnType<typeof vi.fn>;
			expect(findManyCalls).toHaveBeenCalled();

			const callArgs = findManyCalls.mock.calls[0]?.[0];
			expect(callArgs).toBeDefined();
			expect(callArgs).toHaveProperty("orderBy");
			expect(callArgs.orderBy).toEqual([
				desc(actionsTable.assignedAt),
				desc(actionsTable.id),
			]);
		});
	});

	describe("Pagination Edge Cases", () => {
		beforeEach(() => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			});
		});

		it("should handle hasNextPage correctly when there are more results", async () => {
			// Return limit + 1 results to simulate more data
			const extraItem = { ...mockActionItem2, id: "extra-id" };
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem1,
				mockActionItem2,
				extraItem,
			]);

			const result = await resolveActionItemsPaginated(
				mockEvent,
				{ first: 2 },
				ctx,
			);

			expect(result.edges).toHaveLength(2); // Extra result should be removed
			expect(result.pageInfo.hasNextPage).toBe(true);
		});

		it("should handle null cursor values", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem1,
			]);

			const result = await resolveActionItemsPaginated(
				mockEvent,
				{ first: 1, after: null },
				ctx,
			);

			expect(result.edges).toHaveLength(1);
		});

		it("should handle same assignedAt timestamps correctly", async () => {
			const sameTimeItem1 = {
				...mockActionItem1,
				id: "item-1",
			};
			const sameTimeItem2 = {
				...mockActionItem1,
				id: "item-2",
			};

			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				sameTimeItem1,
				sameTimeItem2,
			]);

			const result = await resolveActionItemsPaginated(
				mockEvent,
				{ first: 2 },
				ctx,
			);

			expect(result.edges).toHaveLength(2);
			expect(result.edges[0]?.node.id).toBe("item-1");
			expect(result.edges[1]?.node.id).toBe("item-2");
		});

		it("should handle backward pagination without cursor", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem1,
				mockActionItem2,
			]);

			const result = await resolveActionItemsPaginated(
				mockEvent,
				{ last: 10 },
				ctx,
			);

			expect(result.edges).toHaveLength(2);
			expect(result.pageInfo.hasPreviousPage).toBe(false);

			// Verify the query was called with correct parameters for backward pagination
			const findManyCalls = mocks.drizzleClient.query.actionsTable
				.findMany as ReturnType<typeof vi.fn>;
			const callArgs = findManyCalls.mock.calls[0]?.[0];
			expect(callArgs.orderBy).toEqual([
				desc(actionsTable.assignedAt),
				desc(actionsTable.id),
			]);
		});
	});

	describe("Different Events", () => {
		beforeEach(() => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			});
		});

		it("should work with different event IDs", async () => {
			const differentEvent: EventType = {
				...mockEvent,
				id: "event-2",
				name: "Different Event",
			};

			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem3,
			]);

			const result = await resolveActionItemsPaginated(
				differentEvent,
				{ first: 10 },
				ctx,
			);

			expect(result.edges).toHaveLength(1);
			expect(result.edges[0]?.node).toEqual(mockActionItem3);

			const findManyCalls = mocks.drizzleClient.query.actionsTable
				.findMany as ReturnType<typeof vi.fn>;
			const callArgs = findManyCalls.mock.calls[0]?.[0];
			expect(callArgs.where).toEqual(eq(actionsTable.eventId, "event-2"));
		});
	});

	describe("Error Handling", () => {
		beforeEach(() => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			});
		});

		it("should propagate database errors", async () => {
			const dbError = new Error("Database connection failed");
			mocks.drizzleClient.query.actionsTable.findMany.mockRejectedValue(
				dbError,
			);

			await expect(
				resolveActionItemsPaginated(mockEvent, { first: 10 }, ctx),
			).rejects.toThrow(dbError);
		});

		it("should handle database timeout errors", async () => {
			const timeoutError = new Error("Query timeout");
			mocks.drizzleClient.query.actionsTable.findMany.mockRejectedValue(
				timeoutError,
			);

			await expect(
				resolveActionItemsPaginated(mockEvent, { first: 10 }, ctx),
			).rejects.toThrow(timeoutError);
		});
	});

	describe("Data Integrity", () => {
		beforeEach(() => {
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				id: "user-1",
				role: "administrator",
				organizationMembershipsWhereMember: [],
			});
		});

		it("should return action items with all expected properties", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				mockActionItem1,
			]);

			const result = await resolveActionItemsPaginated(
				mockEvent,
				{ first: 10 },
				ctx,
			);

			expect(result.edges).toHaveLength(1);
			expect(result.edges[0]?.node).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					eventId: expect.any(String),
					assignedAt: expect.any(Date),
					isCompleted: expect.any(Boolean),
					organizationId: expect.any(String),
					createdAt: expect.any(Date),
				}),
			);
		});

		it("should handle null values correctly", async () => {
			const actionItemWithNulls = {
				...mockActionItem1,
				completionAt: null,
				postCompletionNotes: null,
				preCompletionNotes: null,
				updatedAt: null,
				updaterId: null,
			};

			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([
				actionItemWithNulls,
			]);

			const result = await resolveActionItemsPaginated(
				mockEvent,
				{ first: 10 },
				ctx,
			);

			expect(result.edges[0]?.node).toEqual(actionItemWithNulls);
		});

		it("should handle event with no action items", async () => {
			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue([]);

			const result = await resolveActionItemsPaginated(
				mockEvent,
				{ first: 10 },
				ctx,
			);

			expect(result.edges).toHaveLength(0);
			expect(result.pageInfo.hasNextPage).toBe(false);
			expect(result.pageInfo.hasPreviousPage).toBe(false);
			expect(result.pageInfo.startCursor).toBeNull();
			expect(result.pageInfo.endCursor).toBeNull();
		});

		it("should handle maximum limit correctly", async () => {
			const actionItems = Array.from({ length: 32 }, (_, i) => ({
				...mockActionItem1,
				id: `action-${i}`,
				assignedAt: new Date(
					`2024-01-${String(i + 1).padStart(2, "0")}T10:00:00Z`,
				),
			}));

			mocks.drizzleClient.query.actionsTable.findMany.mockResolvedValue(
				actionItems,
			);

			const result = await resolveActionItemsPaginated(
				mockEvent,
				{ first: 32 }, // Maximum allowed
				ctx,
			);

			expect(result.edges).toHaveLength(32);
		});
	});
});
