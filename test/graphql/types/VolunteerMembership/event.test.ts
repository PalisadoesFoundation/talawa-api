import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { VolunteerMembershipEventResolver } from "~/src/graphql/types/VolunteerMembership/event";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

// Mock parent VolunteerMembership
const mockVolunteerMembership = {
	id: "membership-123",
	volunteerId: "volunteer-123",
	groupId: "group-123" as string | null,
	eventId: "event-123",
	status: "accepted" as "accepted" | "invited" | "requested" | "rejected",
	createdBy: "creator-123" as string | null,
	updatedBy: "updater-123" as string | null,
	createdAt: new Date("2024-01-01T10:00:00Z"),
	updatedAt: new Date("2024-01-01T12:00:00Z") as Date | null,
};

const mockEvent = {
	id: "event-123",
	name: "Community Cleanup Event",
	organizationId: "org-123",
	creatorId: "creator-123",
	createdAt: new Date("2024-01-01T08:00:00Z"),
	updatedAt: new Date("2024-01-01T09:00:00Z"),
	startAt: new Date("2024-02-01T10:00:00Z"),
	endAt: new Date("2024-02-01T14:00:00Z"),
	description: "A community cleanup event to help our neighborhood",
	location: "Central Park",
	allDay: false,
	isPublic: true,
	isRegisterable: true,
	updaterId: null,
	isRecurringEventTemplate: false,
};

describe("VolunteerMembershipEventResolver", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			const { context } = createMockGraphQLContext(false);

			await expect(
				VolunteerMembershipEventResolver(mockVolunteerMembership, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				VolunteerMembershipEventResolver(mockVolunteerMembership, {}, context),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});
	});

	describe("Event Retrieval", () => {
		it("should return event with empty attachments array when event exists", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				mockEvent,
			);

			const result = await VolunteerMembershipEventResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result).toEqual({
				...mockEvent,
				attachments: [],
			});
			expect(
				mocks.drizzleClient.query.eventsTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});

		it("should throw unexpected error when event is not found", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				undefined,
			);

			await expect(
				VolunteerMembershipEventResolver(mockVolunteerMembership, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				VolunteerMembershipEventResolver(mockVolunteerMembership, {}, context),
			).rejects.toMatchObject({
				extensions: { code: "unexpected" },
			});

			expect(context.log.warn).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for a volunteer membership's event id that isn't null.",
			);
		});

		it("should query database for event with correct eventId", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				mockEvent,
			);

			await VolunteerMembershipEventResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(
				mocks.drizzleClient.query.eventsTable.findFirst,
			).toHaveBeenCalledTimes(1);
		});
	});

	describe("Return Value Structure", () => {
		it("should always return event with empty attachments array", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				mockEvent,
			);

			const result = await VolunteerMembershipEventResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result).toHaveProperty("attachments");
			expect(result.attachments).toEqual([]);
			expect(Array.isArray(result.attachments)).toBe(true);
		});

		it("should preserve all event properties", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				mockEvent,
			);

			const result = await VolunteerMembershipEventResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			// Verify all original event properties are preserved
			expect(result.id).toBe(mockEvent.id);
			expect(result.name).toBe(mockEvent.name);
			expect(result.description).toBe(mockEvent.description);
			expect(result.organizationId).toBe(mockEvent.organizationId);
			expect(result.creatorId).toBe(mockEvent.creatorId);
			expect(result.startAt).toBe(mockEvent.startAt);
			expect(result.endAt).toBe(mockEvent.endAt);
			expect(result.location).toBe(mockEvent.location);
			expect(result.isPublic).toBe(mockEvent.isPublic);
			expect(result.isRegisterable).toBe(mockEvent.isRegisterable);
		});

		it("should handle events with null values correctly", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const eventWithNulls = {
				...mockEvent,
				updaterId: null,
				description: null,
				location: null,
			};

			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				eventWithNulls,
			);

			const result = await VolunteerMembershipEventResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result.updaterId).toBeNull();
			expect(result.description).toBeNull();
			expect(result.location).toBeNull();
			expect(result.attachments).toEqual([]);
		});
	});

	describe("Edge Cases", () => {
		it("should handle different event IDs correctly", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const differentEvent = { ...mockEvent, id: "different-event-456" };
			const membershipWithDifferentEvent = {
				...mockVolunteerMembership,
				eventId: "different-event-456",
			};

			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				differentEvent,
			);

			const result = await VolunteerMembershipEventResolver(
				membershipWithDifferentEvent,
				{},
				context,
			);

			expect(result.id).toBe("different-event-456");
			expect(result.attachments).toEqual([]);
		});

		it("should handle database connection issues", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.eventsTable.findFirst.mockRejectedValue(
				new Error("Database connection failed"),
			);

			await expect(
				VolunteerMembershipEventResolver(mockVolunteerMembership, {}, context),
			).rejects.toThrow("Database connection failed");
		});

		it("should handle recurring event templates", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const recurringEvent = {
				...mockEvent,
				isRecurringEventTemplate: true,
			};

			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				recurringEvent,
			);

			const result = await VolunteerMembershipEventResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result.isRecurringEventTemplate).toBe(true);
			expect(result.attachments).toEqual([]);
		});

		it("should handle all-day events", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const allDayEvent = {
				...mockEvent,
				allDay: true,
			};

			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				allDayEvent,
			);

			const result = await VolunteerMembershipEventResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result.allDay).toBe(true);
			expect(result.attachments).toEqual([]);
		});
	});

	describe("Data Integrity", () => {
		it("should return complete event object", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				mockEvent,
			);

			const result = await VolunteerMembershipEventResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			// Verify all expected properties are present
			expect(result).toHaveProperty("id");
			expect(result).toHaveProperty("name");
			expect(result).toHaveProperty("organizationId");
			expect(result).toHaveProperty("creatorId");
			expect(result).toHaveProperty("createdAt");
			expect(result).toHaveProperty("updatedAt");
			expect(result).toHaveProperty("startAt");
			expect(result).toHaveProperty("endAt");
			expect(result).toHaveProperty("description");
			expect(result).toHaveProperty("location");
			expect(result).toHaveProperty("allDay");
			expect(result).toHaveProperty("isPublic");
			expect(result).toHaveProperty("isRegisterable");
			expect(result).toHaveProperty("attachments");
		});

		it("should handle events with different properties", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const specialEvent = {
				...mockEvent,
				name: "Special Event",
				isPublic: false,
				isRegisterable: false,
				allDay: true,
			};

			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				specialEvent,
			);

			const result = await VolunteerMembershipEventResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result.name).toBe("Special Event");
			expect(result.isPublic).toBe(false);
			expect(result.isRegisterable).toBe(false);
			expect(result.allDay).toBe(true);
			expect(result.attachments).toEqual([]);
		});
	});

	describe("Date Handling", () => {
		it("should preserve date objects correctly", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				mockEvent,
			);

			const result = await VolunteerMembershipEventResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result.createdAt).toBeInstanceOf(Date);
			expect(result.updatedAt).toBeInstanceOf(Date);
			expect(result.startAt).toBeInstanceOf(Date);
			expect(result.endAt).toBeInstanceOf(Date);
		});

		it("should handle future events correctly", async () => {
			const { context, mocks } = createMockGraphQLContext(true, "user-123");

			const futureEvent = {
				...mockEvent,
				startAt: new Date("2025-02-01T10:00:00Z"),
				endAt: new Date("2025-02-01T14:00:00Z"),
			};

			mocks.drizzleClient.query.eventsTable.findFirst.mockResolvedValue(
				futureEvent,
			);

			const result = await VolunteerMembershipEventResolver(
				mockVolunteerMembership,
				{},
				context,
			);

			expect(result.startAt.getFullYear()).toBe(2025);
			expect(result.endAt.getFullYear()).toBe(2025);
		});
	});
});
