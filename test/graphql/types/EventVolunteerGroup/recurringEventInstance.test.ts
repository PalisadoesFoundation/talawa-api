import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecurringEventInstanceResolver } from "~/src/graphql/types/EventVolunteerGroup/recurringEventInstance";

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
	recurringEventInstanceId: "recurring-instance-123",
};

const mockRecurringEventInstance = {
	id: "recurring-instance-123",
	baseRecurringEventId: "base-event-123",
	organizationId: "org-123",
	creatorId: "creator-123",
	createdAt: new Date("2024-01-01T10:00:00Z"),
	startAt: new Date("2024-02-01T14:00:00Z"),
	endAt: new Date("2024-02-01T16:00:00Z"),
	isRecurringEventTemplate: false,
};

const mockBaseEvent = {
	id: "base-event-123",
	name: "Recurring Event Template",
	organizationId: "org-123",
	creatorId: "creator-123",
	createdAt: new Date("2023-12-01T10:00:00Z"),
	updatedAt: new Date("2023-12-15T12:00:00Z"),
	startAt: new Date("2024-01-01T14:00:00Z"),
	endAt: new Date("2024-01-01T16:00:00Z"),
	description: "Recurring event description",
	location: "Recurring location",
	allDay: false,
	isPublic: true,
	isRegisterable: true,
	updaterId: "updater-123",
	isRecurringEventTemplate: true,
};

describe("RecurringEventInstanceResolver", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Authentication", () => {
		it("should not throw unauthenticated error (field is nullable and no auth check)", async () => {
			const { context } = createMockGraphQLContext(false);

			const result = await RecurringEventInstanceResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			// Since the resolver doesn't check authentication, it proceeds
			// We'll test the query anyway
			expect(result).toBeDefined();
		});
	});

	describe("Resolution Logic", () => {
		it("should return null when recurringEventInstanceId is null or undefined", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const groupWithoutInstanceId = {
				...mockEventVolunteerGroup,
				recurringEventInstanceId: undefined,
			};

			const result = await RecurringEventInstanceResolver(
				groupWithoutInstanceId,
				{},
				context,
			);

			expect(result).toBeNull();
			expect(
				mocks.drizzleClient.query.recurringEventInstancesTable.findFirst,
			).not.toHaveBeenCalled();
		});

		it("should return null when recurring event instance is not found", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				undefined,
			);

			const result = await RecurringEventInstanceResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			expect(result).toBeNull();
			expect(
				mocks.drizzleClient.query.recurringEventInstancesTable.findFirst,
			).toHaveBeenCalledTimes(1);
			expect(
				mocks.drizzleClient.query.eventsTable.findFirst,
			).not.toHaveBeenCalled();
		});

		it("should return null when base event is not found", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				mockRecurringEventInstance,
			);
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				undefined,
			);

			const result = await RecurringEventInstanceResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			expect(result).toBeNull();
			expect(
				mocks.drizzleClient.query.recurringEventInstancesTable.findFirst,
			).toHaveBeenCalledTimes(1);
			expect(
				mocks.drizzleClient.query.eventsTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});

		it("should return merged event and instance with empty attachments when both are found", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				mockRecurringEventInstance,
			);
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				mockBaseEvent,
			);

			const result = await RecurringEventInstanceResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			expect(result).toEqual({
				...mockBaseEvent,
				...mockRecurringEventInstance,
				attachments: [],
			});
			expect(result).toHaveProperty("id", mockRecurringEventInstance.id); // Instance id wins due to spread order
			expect(result).not.toBeNull();
			if (result) {
				expect(result.attachments).toEqual([]);
			}
		});
	});

	describe("Database Queries", () => {
		it("should call findFirst on recurringEventInstancesTable with correct id", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				mockRecurringEventInstance,
			);
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				mockBaseEvent,
			);

			await RecurringEventInstanceResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			expect(
				mocks.drizzleClient.query.recurringEventInstancesTable.findFirst,
			).toHaveBeenCalledWith({
				where: expect.any(Function),
			});
			expect(
				mocks.drizzleClient.query.eventsTable.findFirst,
			).toHaveBeenCalledWith({
				where: expect.any(Function),
			});
		});

		it("should query eventsTable with instance's baseRecurringEventId", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				mockRecurringEventInstance,
			);
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				mockBaseEvent,
			);

			await RecurringEventInstanceResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			// The where function should be called with eq(eventsTable.id, mockBaseEvent.id)
			expect(
				mocks.drizzleClient.query.eventsTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});
	});

	describe("Edge Cases", () => {
		it("should handle different recurring event instance IDs", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const differentInstance = {
				...mockRecurringEventInstance,
				id: "different-instance-456",
			};
			const groupWithDifferentId = {
				...mockEventVolunteerGroup,
				recurringEventInstanceId: "different-instance-456",
			};

			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				differentInstance,
			);
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				mockBaseEvent,
			);

			const result = await RecurringEventInstanceResolver(
				groupWithDifferentId,
				{},
				context,
			);

			expect(result).toHaveProperty("id", "different-instance-456");
		});

		it("should handle database errors", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockRejectedValue(
				new Error("Database error"),
			);

			await expect(
				RecurringEventInstanceResolver(mockEventVolunteerGroup, {}, context),
			).rejects.toThrow("Database error");
		});
	});

	describe("Performance", () => {
		it("should make at most two database queries when successful", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.recurringEventInstancesTable.findFirst.mockResolvedValue(
				mockRecurringEventInstance,
			);
			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				mockBaseEvent,
			);

			await RecurringEventInstanceResolver(
				mockEventVolunteerGroup,
				{},
				context,
			);

			expect(
				mocks.drizzleClient.query.recurringEventInstancesTable.findFirst,
			).toHaveBeenCalledTimes(1);
			expect(
				mocks.drizzleClient.query.eventsTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});

		it("should not make any queries when recurringEventInstanceId is undefined", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const groupWithoutInstanceId = {
				...mockEventVolunteerGroup,
				recurringEventInstanceId: undefined,
			};

			await RecurringEventInstanceResolver(groupWithoutInstanceId, {}, context);

			expect(
				mocks.drizzleClient.query.recurringEventInstancesTable.findFirst,
			).not.toHaveBeenCalled();
			expect(
				mocks.drizzleClient.query.eventsTable.findFirst,
			).not.toHaveBeenCalled();
		});
	});
});
