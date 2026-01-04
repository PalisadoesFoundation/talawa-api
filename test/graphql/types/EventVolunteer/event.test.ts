import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventVolunteerEventResolver } from "~/src/graphql/types/EventVolunteer/event";
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
	recurringEventInstanceId: null,
	isTemplate: false,
};

const mockEvent = {
	id: "event-123",
	name: "Test Event",
	organizationId: "org-123",
	creatorId: "creator-123",
	createdAt: new Date("2024-01-01T10:00:00Z"),
	updatedAt: new Date("2024-01-01T12:00:00Z"),
	startAt: new Date("2024-02-01T14:00:00Z"),
	endAt: new Date("2024-02-01T16:00:00Z"),
	description: "Test event description",
	location: "Test location",
	allDay: false,
	isPublic: true,
	isRegisterable: true,
	updaterId: null,
	isRecurringEventTemplate: false,
};

describe("EventVolunteerEventResolver", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error when client is not authenticated", async () => {
			const { context } = createMockGraphQLContext(false);

			await expect(
				EventVolunteerEventResolver(mockEventVolunteer, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				EventVolunteerEventResolver(mockEventVolunteer, {}, context),
			).rejects.toMatchObject({
				extensions: { code: "unauthenticated" },
			});
		});
	});

	describe("Event Retrieval", () => {
		it("should return event with attachments array when event exists", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			context.dataloaders.event.load = vi.fn().mockResolvedValue(mockEvent);

			const result = await EventVolunteerEventResolver(
				mockEventVolunteer,
				{},
				context,
			);

			expect(result).toEqual({
				...mockEvent,
				attachments: [],
			});
			expect(context.dataloaders.event.load).toHaveBeenCalledWith("event-123");
		});

		it("should throw unexpected error when event is not found", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			context.dataloaders.event.load = vi.fn().mockResolvedValue(null);

			await expect(
				EventVolunteerEventResolver(mockEventVolunteer, {}, context),
			).rejects.toThrow(TalawaGraphQLError);

			await expect(
				EventVolunteerEventResolver(mockEventVolunteer, {}, context),
			).rejects.toMatchObject({
				extensions: { code: "unexpected" },
			});

			expect(context.log.warn).toHaveBeenCalledWith(
				"Postgres select operation returned an empty array for an event volunteer's event id that isn't null.",
			);
		});

		it("should call DataLoader for event", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			context.dataloaders.event.load = vi.fn().mockResolvedValue(mockEvent);

			await EventVolunteerEventResolver(mockEventVolunteer, {}, context);

			expect(context.dataloaders.event.load).toHaveBeenCalledWith("event-123");
			expect(context.dataloaders.event.load).toHaveBeenCalledTimes(1);
		});
	});

	describe("Return Value Structure", () => {
		it("should always return event with empty attachments array", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			context.dataloaders.event.load = vi.fn().mockResolvedValue(mockEvent);

			const result = await EventVolunteerEventResolver(
				mockEventVolunteer,
				{},
				context,
			);

			expect(result).toHaveProperty("attachments");
			expect(result.attachments).toEqual([]);
			expect(Array.isArray(result.attachments)).toBe(true);
		});

		it("should preserve all event properties", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			context.dataloaders.event.load = vi.fn().mockResolvedValue(mockEvent);

			const result = await EventVolunteerEventResolver(
				mockEventVolunteer,
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
			expect(result.isPublic).toBe(mockEvent.isPublic);
		});
	});

	describe("Edge Cases", () => {
		it("should handle different event IDs correctly", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			const differentEvent = { ...mockEvent, id: "different-event-456" };
			const volunteerWithDifferentEvent = {
				...mockEventVolunteer,
				eventId: "different-event-456",
			};

			context.dataloaders.event.load = vi
				.fn()
				.mockResolvedValue(differentEvent);

			const result = await EventVolunteerEventResolver(
				volunteerWithDifferentEvent,
				{},
				context,
			);

			expect(result.id).toBe("different-event-456");
			expect(result.attachments).toEqual([]);
		});

		it("should handle database connection issues", async () => {
			const { context } = createMockGraphQLContext(true, "user-123");

			context.dataloaders.event.load = vi
				.fn()
				.mockRejectedValue(new Error("Database connection failed"));

			await expect(
				EventVolunteerEventResolver(mockEventVolunteer, {}, context),
			).rejects.toThrow("Database connection failed");
		});
	});
});
