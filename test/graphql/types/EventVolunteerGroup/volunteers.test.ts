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
	recurringEventInstanceId: null,
	isTemplate: false,
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

const mockPendingVolunteers = [
	{
		id: "volunteer-3",
		userId: "user-3",
		eventId: "event-123",
		creatorId: "creator-123",
		hasAccepted: false,
		isPublic: true,
		hoursVolunteered: "0.00",
		createdAt: new Date("2024-01-02T10:00:00Z"),
		updatedAt: new Date("2024-01-02T10:00:00Z"),
		updaterId: null,
	},
];

// Mock query result structure from drizzle select
const mockQueryResults = [
	{ volunteer: mockVolunteers[0] },
	{ volunteer: mockVolunteers[1] },
];

type ChainMocks = {
	executeMock: ReturnType<typeof vi.fn>;
	whereMock: ReturnType<typeof vi.fn>;
	innerJoinMock: ReturnType<typeof vi.fn>;
	fromMock: ReturnType<typeof vi.fn>;
};

const buildSelectChain = (
	mocks: ReturnType<typeof createMockGraphQLContext>["mocks"],
	resolvedValue: unknown,
): ChainMocks => {
	const executeMock = vi.fn().mockResolvedValue(resolvedValue);
	const whereMock = vi.fn().mockReturnValue({ execute: executeMock });
	const innerJoinMock = vi.fn().mockReturnValue({ where: whereMock });
	const fromMock = vi.fn().mockReturnValue({ innerJoin: innerJoinMock });

	mocks.drizzleClient.select.mockReturnValue({ from: fromMock });

	return { executeMock, whereMock, innerJoinMock, fromMock };
};

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

	describe("Default behavior (status omitted)", () => {
		it("should return accepted volunteers when status arg is omitted", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			buildSelectChain(mocks, mockQueryResults);

			const result = await EventVolunteerGroupVolunteersResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			expect(result).toEqual(mockVolunteers);
		});

		it("should return accepted volunteers when status is null", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			buildSelectChain(mocks, mockQueryResults);

			const result = await EventVolunteerGroupVolunteersResolver(
				mockEventVolunteerGroup,
				{ status: null },
				context,
			);

			expect(result).toEqual(mockVolunteers);
		});

		it("should return empty array when no accepted volunteers exist", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			buildSelectChain(mocks, []);

			const result = await EventVolunteerGroupVolunteersResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			expect(result).toEqual([]);
		});

		it("should run exactly one joined query (no N+1)", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			const { executeMock, whereMock, innerJoinMock, fromMock } =
				buildSelectChain(mocks, mockQueryResults);

			await EventVolunteerGroupVolunteersResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			expect(mocks.drizzleClient.select).toHaveBeenCalledTimes(1);
			expect(fromMock).toHaveBeenCalledTimes(1);
			expect(innerJoinMock).toHaveBeenCalledTimes(1);
			expect(whereMock).toHaveBeenCalledTimes(1);
			expect(executeMock).toHaveBeenCalledTimes(1);
		});

		it("should not make additional queries for basic operations", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			buildSelectChain(mocks, mockQueryResults);

			await EventVolunteerGroupVolunteersResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			expect(
				mocks.drizzleClient.query.usersTable.findFirst,
			).not.toHaveBeenCalled();
			expect(
				mocks.drizzleClient.query.eventVolunteersTable.findMany,
			).not.toHaveBeenCalled();
		});
	});

	describe("Status filter", () => {
		it("should return invited volunteers when status='invited'", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			const invitedResults = mockPendingVolunteers.map((v) => ({
				volunteer: v,
			}));
			buildSelectChain(mocks, invitedResults);

			const result = await EventVolunteerGroupVolunteersResolver(
				mockEventVolunteerGroup,
				{ status: "invited" },
				context,
			);

			expect(result).toEqual(mockPendingVolunteers);
			expect(result.every((v) => v.hasAccepted === false)).toBe(true);
		});

		it("should return requested volunteers when status='requested'", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			const requestedResults = mockPendingVolunteers.map((v) => ({
				volunteer: v,
			}));
			buildSelectChain(mocks, requestedResults);

			const result = await EventVolunteerGroupVolunteersResolver(
				mockEventVolunteerGroup,
				{ status: "requested" },
				context,
			);

			expect(result).toEqual(mockPendingVolunteers);
		});

		it("should return rejected volunteers when status='rejected'", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			const rejectedResults = mockPendingVolunteers.map((v) => ({
				volunteer: v,
			}));
			buildSelectChain(mocks, rejectedResults);

			const result = await EventVolunteerGroupVolunteersResolver(
				mockEventVolunteerGroup,
				{ status: "rejected" },
				context,
			);

			expect(result).toEqual(mockPendingVolunteers);
		});

		it("should treat status='accepted' identically to the default", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");
			buildSelectChain(mocks, mockQueryResults);

			const result = await EventVolunteerGroupVolunteersResolver(
				mockEventVolunteerGroup,
				{ status: "accepted" },
				context,
			);

			expect(result).toEqual(mockVolunteers);
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
			buildSelectChain(mocks, customQueryResults);

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
			buildSelectChain(mocks, multipleVolunteersResults);

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

	describe("Edge Cases", () => {
		it("should handle different group IDs correctly", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const differentGroup = {
				...mockEventVolunteerGroup,
				id: "different-group-456",
			};
			buildSelectChain(mocks, []);

			const result = await EventVolunteerGroupVolunteersResolver(
				differentGroup,
				{},
				context,
			);

			expect(result).toEqual([]);
		});

		it("should propagate database errors", async () => {
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
	});
});
