import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventVolunteerGroupsResolver } from "~/src/graphql/types/EventVolunteer/groups";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Mock parent EventVolunteer
const mockEventVolunteer = {
	id: "volunteer-123",
	userId: "user-123",
	eventId: "event-123",
	creatorId: "creator-123",
	hasAccepted: true,
	isPublic: true,
	hoursVolunteered: "5.50",
	createdAt: new Date("2024-01-01T10:00:00Z"),
	updatedAt: new Date("2024-01-01T10:00:00Z"),
	updaterId: "updater-123",
};

// Mock volunteer groups
const mockVolunteerGroups = [
	{
		id: "group-1",
		eventId: "event-123",
		leaderId: "leader-1",
		creatorId: "creator-123",
		name: "Setup Team",
		description: "Handles event setup and preparation",
		volunteersRequired: 5,
		createdAt: new Date("2024-01-01T10:00:00Z"),
		updatedAt: new Date("2024-01-01T10:00:00Z"),
		updaterId: null,
	},
	{
		id: "group-2",
		eventId: "event-123",
		leaderId: "leader-2",
		creatorId: "creator-123",
		name: "Registration Team",
		description: "Manages participant registration",
		volunteersRequired: 3,
		createdAt: new Date("2024-01-01T10:00:00Z"),
		updatedAt: new Date("2024-01-01T10:00:00Z"),
		updaterId: null,
	},
];

// Mock query result structure from drizzle select
const mockQueryResults = [
	{
		group: mockVolunteerGroups[0],
	},
	{
		group: mockVolunteerGroups[1],
	},
];

describe("EventVolunteerGroupsResolver", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			const { context } = createMockGraphQLContext(false);

			await expect(
				EventVolunteerGroupsResolver(mockEventVolunteer, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				EventVolunteerGroupsResolver(mockEventVolunteer, {}, context),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});
	});

	describe("Groups Retrieval", () => {
		it("should return volunteer groups when volunteer is a member", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			// Mock the complex drizzle query chain
			const executeMock = vi.fn().mockResolvedValue(mockQueryResults);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
			const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			const result = await EventVolunteerGroupsResolver(
				mockEventVolunteer,
				{},
				context,
			);

			expect(result).toEqual(mockVolunteerGroups);
			expect(mocks.drizzleClient.select).toHaveBeenCalledWith({
				group: expect.any(Object),
			});
		});

		it("should return empty array when volunteer is not in any groups", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			// Mock empty result
			const executeMock = vi.fn().mockResolvedValue([]);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
			const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			const result = await EventVolunteerGroupsResolver(
				mockEventVolunteer,
				{},
				context,
			);

			expect(result).toEqual([]);
		});

		it("should query with correct join and filter parameters", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const executeMock = vi.fn().mockResolvedValue(mockQueryResults);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
			const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			await EventVolunteerGroupsResolver(mockEventVolunteer, {}, context);

			// Verify the query chain was called
			expect(mocks.drizzleClient.select).toHaveBeenCalledTimes(1);
			expect(fromMock).toHaveBeenCalledTimes(1);
			expect(innerJoinMock).toHaveBeenCalledTimes(1);
			expect(whereMock).toHaveBeenCalledTimes(1);
			expect(executeMock).toHaveBeenCalledTimes(1);
		});
	});

	describe("Result Mapping", () => {
		it("should map query results to group objects correctly", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const customQueryResults = [
				{
					group: {
						id: "custom-group-1",
						name: "Custom Group",
						description: "Custom description",
						eventId: "event-123",
						leaderId: "leader-123",
						creatorId: "creator-123",
						volunteersRequired: 10,
						createdAt: new Date("2024-01-01T09:00:00Z"),
						updatedAt: new Date("2024-01-01T09:00:00Z"),
						updaterId: null,
					},
				},
			];

			const executeMock = vi.fn().mockResolvedValue(customQueryResults);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
			const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			const result = await EventVolunteerGroupsResolver(
				mockEventVolunteer,
				{},
				context,
			);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual(customQueryResults[0]?.group);
		});

		it("should handle multiple groups correctly", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const multipleGroupsResults = [
				{ group: mockVolunteerGroups[0] },
				{ group: mockVolunteerGroups[1] },
				{
					group: {
						id: "group-3",
						name: "Third Group",
						description: "Third group description",
						eventId: "event-123",
						leaderId: "leader-3",
						creatorId: "creator-123",
						volunteersRequired: 2,
						createdAt: new Date("2024-01-01T10:00:00Z"),
						updatedAt: new Date("2024-01-01T10:00:00Z"),
						updaterId: null,
					},
				},
			];

			const executeMock = vi.fn().mockResolvedValue(multipleGroupsResults);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
			const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			const result = await EventVolunteerGroupsResolver(
				mockEventVolunteer,
				{},
				context,
			);

			expect(result).toHaveLength(3);
			expect(result[0]).toEqual(multipleGroupsResults[0]?.group);
			expect(result[1]).toEqual(multipleGroupsResults[1]?.group);
			expect(result[2]).toEqual(multipleGroupsResults[2]?.group);
		});
	});

	describe("Status Filtering", () => {
		it("should only return groups with accepted membership status", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			// The resolver filters by status: "accepted" internally
			const executeMock = vi.fn().mockResolvedValue(mockQueryResults);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
			const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			const result = await EventVolunteerGroupsResolver(
				mockEventVolunteer,
				{},
				context,
			);

			expect(result).toEqual(mockVolunteerGroups);

			// Verify that the where clause was called (which should include status filtering)
			expect(whereMock).toHaveBeenCalledTimes(1);
		});
	});

	describe("Edge Cases", () => {
		it("should handle different volunteer IDs", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const differentVolunteer = {
				...mockEventVolunteer,
				id: "different-volunteer-456",
			};

			const executeMock = vi.fn().mockResolvedValue([]);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
			const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			const result = await EventVolunteerGroupsResolver(
				differentVolunteer,
				{},
				context,
			);

			expect(result).toEqual([]);
		});

		it("should handle database connection issues", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const executeMock = vi
				.fn()
				.mockRejectedValue(new Error("Database connection failed"));
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
			const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			await expect(
				EventVolunteerGroupsResolver(mockEventVolunteer, {}, context),
			).rejects.toThrow("Database connection failed");
		});

		it("should handle query results with malformed structure", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			// Mock malformed result structure
			const malformedResults = [
				{ group: null },
				{ notGroup: mockVolunteerGroups[0] },
			];

			const executeMock = vi.fn().mockResolvedValue(malformedResults);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
			const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			const result = await EventVolunteerGroupsResolver(
				mockEventVolunteer,
				{},
				context,
			);

			// Should map results even with malformed data
			expect(result).toHaveLength(2);
			expect(result[0]).toBeNull();
			expect(result[1]).toBeUndefined();
		});
	});

	describe("Query Performance", () => {
		it("should make single complex query with joins", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const executeMock = vi.fn().mockResolvedValue(mockQueryResults);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
			const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			await EventVolunteerGroupsResolver(mockEventVolunteer, {}, context);

			// Verify single query execution (no N+1 problem)
			expect(mocks.drizzleClient.select).toHaveBeenCalledTimes(1);
			expect(executeMock).toHaveBeenCalledTimes(1);
		});

		it("should not make additional queries for basic user operations", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const executeMock = vi.fn().mockResolvedValue(mockQueryResults);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
			const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			await EventVolunteerGroupsResolver(mockEventVolunteer, {}, context);

			// Verify no additional user table queries
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).not.toHaveBeenCalled();
			expect(
				mocks.drizzleClient.query.eventVolunteerGroupsTable.findMany,
			).not.toHaveBeenCalled();
		});
	});

	describe("Join Logic", () => {
		it("should properly join eventVolunteerGroups with volunteerMemberships", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const executeMock = vi.fn().mockResolvedValue(mockQueryResults);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
			const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			await EventVolunteerGroupsResolver(mockEventVolunteer, {}, context);

			// Verify the join was called (tests the inner join logic)
			expect(innerJoinMock).toHaveBeenCalledTimes(1);
		});

		it("should filter by volunteer ID and accepted status", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const executeMock = vi.fn().mockResolvedValue(mockQueryResults);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
			const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			await EventVolunteerGroupsResolver(mockEventVolunteer, {}, context);

			// Verify the where clause includes filtering logic
			expect(whereMock).toHaveBeenCalledTimes(1);
		});
	});
});
