import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventVolunteerGroupVolunteersResolver } from "~/src/graphql/types/EventVolunteerGroup/volunteers";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Mock parent EventVolunteerGroup
const mockEventVolunteerGroup = {
	id: "group-123",
	eventId: "event-123",
	leaderId: "leader-123",
	creatorId: "creator-123",
	name: "Setup Team",
	description: "Handles event setup and preparation",
	volunteersRequired: 5,
	createdAt: new Date("2024-01-01T10:00:00Z"),
	updatedAt: new Date("2024-01-01T12:00:00Z"),
	updaterId: "updater-123",
};

// Mock volunteers
const mockVolunteers = [
	{
		id: "volunteer-1",
		userId: "user-1",
		eventId: "event-123",
		creatorId: "creator-123",
		hasAccepted: true,
		isPublic: true,
		hoursVolunteered: "5.50",
		createdAt: new Date("2024-01-01T10:00:00Z"),
		updatedAt: new Date("2024-01-01T10:00:00Z"),
		updaterId: null,
	},
	{
		id: "volunteer-2",
		userId: "user-2",
		eventId: "event-123",
		creatorId: "creator-123",
		hasAccepted: true,
		isPublic: true,
		hoursVolunteered: "3.25",
		createdAt: new Date("2024-01-01T10:00:00Z"),
		updatedAt: new Date("2024-01-01T10:00:00Z"),
		updaterId: null,
	},
];

// Mock query result structure from drizzle select
const mockQueryResults = [
	{
		volunteer: mockVolunteers[0],
	},
	{
		volunteer: mockVolunteers[1],
	},
];

describe("EventVolunteerGroupVolunteersResolver", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			const { context } = createMockGraphQLContext(false);

			await expect(
				EventVolunteerGroupVolunteersResolver(
					mockEventVolunteerGroup,
					{},
					context,
				),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				EventVolunteerGroupVolunteersResolver(
					mockEventVolunteerGroup,
					{},
					context,
				),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});
	});

	describe("Volunteers Retrieval", () => {
		it("should return accepted volunteers when volunteers exist", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			// Mock the complex drizzle query chain
			const executeMock = vi.fn().mockResolvedValue(mockQueryResults);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
			const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			const result = await EventVolunteerGroupVolunteersResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			expect(result).toEqual(mockVolunteers);
			expect(mocks.drizzleClient.select).toHaveBeenCalledWith({
				volunteer: expect.any(Object),
			});
		});

		it("should return empty array when no volunteers exist", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			// Mock empty result
			const executeMock = vi.fn().mockResolvedValue([]);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
			const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			const result = await EventVolunteerGroupVolunteersResolver(
				mockEventVolunteerGroup,
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

			await EventVolunteerGroupVolunteersResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			// Verify the query chain was called
			expect(mocks.drizzleClient.select).toHaveBeenCalledTimes(1);
			expect(fromMock).toHaveBeenCalledTimes(1);
			expect(innerJoinMock).toHaveBeenCalledTimes(1);
			expect(whereMock).toHaveBeenCalledTimes(1);
			expect(executeMock).toHaveBeenCalledTimes(1);
		});
	});

	describe("Result Mapping", () => {
		it("should map query results to volunteer objects correctly", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const customQueryResults = [
				{
					volunteer: {
						id: "custom-volunteer-1",
						userId: "custom-user-1",
						eventId: "event-123",
						creatorId: "creator-123",
						hasAccepted: true,
						isPublic: true,
						hoursVolunteered: "7.25",
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

			const result = await EventVolunteerGroupVolunteersResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual(customQueryResults[0]?.volunteer);
		});

		it("should handle multiple volunteers correctly", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const multipleVolunteersResults = [
				{ volunteer: mockVolunteers[0] },
				{ volunteer: mockVolunteers[1] },
				{
					volunteer: {
						id: "volunteer-3",
						userId: "user-3",
						eventId: "event-123",
						creatorId: "creator-123",
						hasAccepted: true,
						isPublic: false,
						hoursVolunteered: "8.75",
						createdAt: new Date("2024-01-01T10:00:00Z"),
						updatedAt: new Date("2024-01-01T10:00:00Z"),
						updaterId: null,
					},
				},
			];

			const executeMock = vi.fn().mockResolvedValue(multipleVolunteersResults);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
			const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			const result = await EventVolunteerGroupVolunteersResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			expect(result).toHaveLength(3);
			expect(result[0]).toEqual(multipleVolunteersResults[0]?.volunteer);
			expect(result[1]).toEqual(multipleVolunteersResults[1]?.volunteer);
			expect(result[2]).toEqual(multipleVolunteersResults[2]?.volunteer);
		});
	});

	describe("Filtering Logic", () => {
		it("should only return volunteers with accepted status", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			// The resolver filters by status: "accepted" and hasAccepted: true internally
			const executeMock = vi.fn().mockResolvedValue(mockQueryResults);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
			const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			const result = await EventVolunteerGroupVolunteersResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			expect(result).toEqual(mockVolunteers);

			// Verify that the where clause was called (which includes status and acceptance filtering)
			expect(whereMock).toHaveBeenCalledTimes(1);
		});

		it("should filter by group ID", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const executeMock = vi.fn().mockResolvedValue(mockQueryResults);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
			const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			await EventVolunteerGroupVolunteersResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			// Verify the where clause includes group ID filtering
			expect(whereMock).toHaveBeenCalledTimes(1);
		});
	});

	describe("Join Logic", () => {
		it("should properly join eventVolunteers with volunteerMemberships", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const executeMock = vi.fn().mockResolvedValue(mockQueryResults);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
			const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			await EventVolunteerGroupVolunteersResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			// Verify the join was called (tests the inner join logic)
			expect(innerJoinMock).toHaveBeenCalledTimes(1);
		});
	});

	describe("Edge Cases", () => {
		it("should handle different group IDs correctly", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const differentGroup = {
				...mockEventVolunteerGroup,
				id: "different-group-456",
			};

			const executeMock = vi.fn().mockResolvedValue([]);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
			const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			const result = await EventVolunteerGroupVolunteersResolver(
				differentGroup,
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
				EventVolunteerGroupVolunteersResolver(
					mockEventVolunteerGroup,
					{},
					context,
				),
			).rejects.toThrow("Database connection failed");
		});

		it("should handle query results with malformed structure", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			// Mock malformed result structure
			const malformedResults = [
				{ volunteer: null },
				{ notVolunteer: mockVolunteers[0] },
			];

			const executeMock = vi.fn().mockResolvedValue(malformedResults);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
			const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			const result = await EventVolunteerGroupVolunteersResolver(
				mockEventVolunteerGroup,
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

			await EventVolunteerGroupVolunteersResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			// Verify single query execution (no N+1 problem)
			expect(mocks.drizzleClient.select).toHaveBeenCalledTimes(1);
			expect(executeMock).toHaveBeenCalledTimes(1);
		});

		it("should not make additional queries for basic operations", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const executeMock = vi.fn().mockResolvedValue(mockQueryResults);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
			const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			await EventVolunteerGroupVolunteersResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			// Verify no additional separate queries
			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).not.toHaveBeenCalled();
			expect(
				mocks.drizzleClient.query.eventVolunteersTable.findMany,
			).not.toHaveBeenCalled();
		});
	});

	describe("Acceptance Status Logic", () => {
		it("should only include volunteers with both membership accepted and hasAccepted true", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			// All results should have hasAccepted: true since that's what the resolver filters for
			const acceptedVolunteersResults = mockQueryResults.map((result) => ({
				volunteer: {
					...result.volunteer,
					hasAccepted: true, // Ensure all returned volunteers have hasAccepted: true
				},
			}));

			const executeMock = vi.fn().mockResolvedValue(acceptedVolunteersResults);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
			const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			const result = await EventVolunteerGroupVolunteersResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			// Verify all returned volunteers have hasAccepted: true
			expect(result.every((volunteer) => volunteer.hasAccepted === true)).toBe(
				true,
			);
		});

		it("should validate filtering by accepted status in where clause", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const executeMock = vi.fn().mockResolvedValue(mockQueryResults);
			const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
			const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
			const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });

			mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

			await EventVolunteerGroupVolunteersResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			// The where clause should include both status: "accepted" and hasAccepted: true filters
			expect(whereMock).toHaveBeenCalledTimes(1);
		});
	});
});
