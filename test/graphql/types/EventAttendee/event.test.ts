import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { GraphQLContext } from "~/src/graphql/context";
import type { EventAttendee as EventAttendeeType } from "~/src/graphql/types/EventAttendee/EventAttendee";
import { eventAttendeeEventResolver } from "~/src/graphql/types/EventAttendee/event";
import { getRecurringEventInstancesByIds } from "~/src/graphql/types/Query/eventQueries/recurringEventInstanceQueries";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";

vi.mock(
	"~/src/graphql/types/Query/eventQueries/recurringEventInstanceQueries",
	() => ({
		getRecurringEventInstancesByIds: vi.fn(),
	}),
);

describe("EventAttendee Event Resolver Tests", () => {
	let ctx: GraphQLContext;
	let mockEventAttendee: EventAttendeeType;

	beforeEach(() => {
		const { context } = createMockGraphQLContext(true, "user-123");
		ctx = context;
		mockEventAttendee = {
			id: "attendee-123",
			userId: "user-789",
			eventId: "event-456",
			recurringEventInstanceId: null,
			checkinTime: null,
			checkoutTime: null,
			feedbackSubmitted: false,
			isInvited: true,
			isRegistered: true,
			isCheckedIn: false,
			isCheckedOut: false,
			createdAt: new Date("2024-03-10T08:00:00Z"),
			updatedAt: new Date("2024-03-10T08:00:00Z"),
		} as EventAttendeeType;
	});

	afterEach(() => {
		vi.clearAllMocks();
		vi.restoreAllMocks();
	});

	describe("Authentication", () => {
		it("should throw unauthenticated error if user is not logged in", async () => {
			ctx.currentClient.isAuthenticated = false;

			await expect(
				eventAttendeeEventResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unauthenticated" } }),
			);
		});
	});

	describe("Standalone Event Resolution", () => {
		it("should successfully resolve standalone event", async () => {
			const mockEvent = {
				id: "event-456",
				name: "Test Event",
				description: "Test Description",
				startAt: new Date("2024-03-10T09:00:00Z"),
				endAt: new Date("2024-03-10T12:00:00Z"),
				organizationId: "org-123",
				isPublic: true,
				isRegisterable: true,
				allDay: false,
			};

			ctx.dataloaders.event.load = vi.fn().mockResolvedValue(mockEvent);

			const result = await eventAttendeeEventResolver(
				mockEventAttendee,
				{},
				ctx,
			);

			expect(result).toEqual({
				...mockEvent,
				attachments: [],
			});
			expect(ctx.dataloaders.event.load).toHaveBeenCalledWith("event-456");
		});

		it("should throw unexpected error if standalone event is not found", async () => {
			ctx.dataloaders.event.load = vi.fn().mockResolvedValue(null);

			await expect(
				eventAttendeeEventResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);

			expect(ctx.log.warn).toHaveBeenCalledWith(
				{
					eventAttendeeId: "attendee-123",
					eventId: "event-456",
				},
				"DataLoader returned null for an event attendee's event id that isn't null.",
			);
		});

		it("should handle DataLoader error when fetching standalone event", async () => {
			ctx.dataloaders.event.load = vi
				.fn()
				.mockRejectedValue(new Error("Database connection failed"));

			await expect(
				eventAttendeeEventResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow("Database connection failed");
		});
	});

	describe("Recurring Event Instance Resolution", () => {
		const mockResolvedInstance = {
			id: "instance-789",
			name: "Recurring Instance Event",
			description: "Instance description",
			location: "Instance location",
			actualStartTime: new Date("2024-03-15T09:00:00Z"),
			actualEndTime: new Date("2024-03-15T12:00:00Z"),
			organizationId: "org-123",
			baseRecurringEventId: "template-456",
			recurrenceRuleId: "rule-789",
			originalSeriesId: "series-123",
			originalInstanceStartTime: new Date("2024-03-15T09:00:00Z"),
			isCancelled: false,
			generatedAt: new Date("2024-03-01T00:00:00Z"),
			lastUpdatedAt: null,
			version: "1",
			sequenceNumber: 1,
			totalCount: 10,
			allDay: false,
			isPublic: true,
			isRegisterable: true,
			isInviteOnly: false,
			creatorId: "creator-123",
			updaterId: null,
			createdAt: new Date("2024-03-01T00:00:00Z"),
			updatedAt: null,
			hasExceptions: false,
			appliedExceptionData: null,
			exceptionCreatedBy: null,
			exceptionCreatedAt: null,
			attachments: [],
		};

		it("should resolve recurring event instance and return resolved instance", async () => {
			// FIX: Manually mock the loader so .not.toHaveBeenCalled() works correctly
			ctx.dataloaders.event.load = vi.fn();

			const recurringAttendee = {
				...mockEventAttendee,
				eventId: null,
				recurringEventInstanceId: "instance-789",
			} as EventAttendeeType;

			// FIX: Explicitly set attachments to undefined to test the resolver's ?? [] logic
			vi.mocked(getRecurringEventInstancesByIds).mockResolvedValue([
				{
					...mockResolvedInstance,
					// FIX: Use 'as any' to bypass TypeScript complaint about undefined
					// biome-ignore lint/suspicious/noExplicitAny: Testing undefined edge case
					attachments: undefined as any,
				},
			]);

			const result = await eventAttendeeEventResolver(
				recurringAttendee,
				{},
				ctx,
			);

			expect(result).toEqual({
				...mockResolvedInstance,
				attachments: [], // Verified: undefined input became [] output
			});
			expect(getRecurringEventInstancesByIds).toHaveBeenCalledWith(
				["instance-789"],
				ctx.drizzleClient,
				ctx.log,
			);
			expect(ctx.dataloaders.event.load).not.toHaveBeenCalled();
		});

		it("should include attachments when resolved instance has attachments", async () => {
			const recurringAttendee = {
				...mockEventAttendee,
				eventId: null,
				recurringEventInstanceId: "instance-789",
			} as EventAttendeeType;

			const instanceWithAttachments = {
				...mockResolvedInstance,
				attachments: [
					{
						name: "doc.pdf",
						creatorId: "creator-123",
						updaterId: null,
						mimeType: "image/png",
						eventId: "template-456",
						createdAt: new Date("2024-03-01T00:00:00Z"),
						updatedAt: null,
					},
				],
			};

			vi.mocked(getRecurringEventInstancesByIds).mockResolvedValue([
				instanceWithAttachments,
			]);

			const result = await eventAttendeeEventResolver(
				recurringAttendee,
				{},
				ctx,
			);

			expect(result?.attachments).toEqual(instanceWithAttachments.attachments);
		});

		it("should throw unexpected error when recurring instance is not found", async () => {
			const recurringAttendee = {
				...mockEventAttendee,
				eventId: null,
				recurringEventInstanceId: "instance-789",
			} as EventAttendeeType;

			vi.mocked(getRecurringEventInstancesByIds).mockResolvedValue([]);

			await expect(
				eventAttendeeEventResolver(recurringAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);

			expect(ctx.log.warn).toHaveBeenCalledWith(
				{
					eventAttendeeId: "attendee-123",
					recurringEventInstanceId: "instance-789",
				},
				"Failed to find recurring event instance for event attendee.",
			);
		});

		it("should propagate errors from getRecurringEventInstancesByIds", async () => {
			const recurringAttendee = {
				...mockEventAttendee,
				eventId: null,
				recurringEventInstanceId: "instance-789",
			} as EventAttendeeType;

			vi.mocked(getRecurringEventInstancesByIds).mockRejectedValue(
				new Error("Database connection failed"),
			);

			await expect(
				eventAttendeeEventResolver(recurringAttendee, {}, ctx),
			).rejects.toThrow("Database connection failed");
		});
	});

	describe("Edge Cases", () => {
		it("should return null when neither eventId nor recurringEventInstanceId exists", async () => {
			const invalidAttendee = {
				...mockEventAttendee,
				eventId: null,
				recurringEventInstanceId: null,
			} as EventAttendeeType;

			const result = await eventAttendeeEventResolver(invalidAttendee, {}, ctx);
			expect(result).toBeNull();
		});

		it("should handle malformed eventId gracefully", async () => {
			const malformedAttendee = {
				...mockEventAttendee,
				eventId: "invalid-uuid-format",
			} as EventAttendeeType;

			ctx.dataloaders.event.load = vi
				.fn()
				.mockRejectedValue(new Error("Invalid UUID format"));

			await expect(
				eventAttendeeEventResolver(malformedAttendee, {}, ctx),
			).rejects.toThrow("Invalid UUID format");
		});

		it("should handle deleted events", async () => {
			ctx.dataloaders.event.load = vi.fn().mockResolvedValue(null);

			await expect(
				eventAttendeeEventResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow(
				new TalawaGraphQLError({ extensions: { code: "unexpected" } }),
			);
		});
	});

	describe("Event Data Handling", () => {
		it("should always include empty attachments array", async () => {
			const eventWithoutAttachments = {
				id: "event-456",
				name: "Simple Event",
				organizationId: "org-123",
			};

			ctx.dataloaders.event.load = vi
				.fn()
				.mockResolvedValue(eventWithoutAttachments);

			const result = await eventAttendeeEventResolver(
				mockEventAttendee,
				{},
				ctx,
			);

			expect(result).toEqual({
				...eventWithoutAttachments,
				attachments: [],
			});
			expect(result?.attachments).toEqual([]);
		});

		it("should handle events with complete data", async () => {
			const completeEvent = {
				id: "event-456",
				name: "Complete Event",
				description: "Full event description",
				location: "New York Convention Center",
				startAt: new Date("2024-03-15T09:00:00Z"),
				endAt: new Date("2024-03-15T17:00:00Z"),
				organizationId: "org-123",
				creatorId: "creator-123",
				updaterId: "updater-456",
				isPublic: true,
				isRegisterable: true,
				allDay: false,
				createdAt: new Date("2024-03-01T10:00:00Z"),
				updatedAt: new Date("2024-03-05T14:00:00Z"),
			};

			ctx.dataloaders.event.load = vi.fn().mockResolvedValue(completeEvent);

			const result = await eventAttendeeEventResolver(
				mockEventAttendee,
				{},
				ctx,
			);

			expect(result).toEqual({
				...completeEvent,
				attachments: [],
			});
		});

		it("should handle events with minimal data", async () => {
			const minimalEvent = {
				id: "event-456",
				name: "Minimal Event",
				organizationId: "org-123",
			};

			ctx.dataloaders.event.load = vi.fn().mockResolvedValue(minimalEvent);

			const result = await eventAttendeeEventResolver(
				mockEventAttendee,
				{},
				ctx,
			);

			expect(result).toEqual({
				...minimalEvent,
				attachments: [],
			});
		});
	});

	describe("Performance Tests", () => {
		it("should handle multiple attendees for same event efficiently", async () => {
			const sharedEvent = {
				id: "event-456",
				name: "Popular Event",
				organizationId: "org-123",
			};

			ctx.dataloaders.event.load = vi.fn().mockResolvedValue(sharedEvent);

			const attendees = Array.from({ length: 12 }, (_, i) => ({
				...mockEventAttendee,
				id: `attendee-${i}`,
				userId: `user-${i}`,
			})) as EventAttendeeType[];

			const results = await Promise.all(
				attendees.map((attendee) =>
					eventAttendeeEventResolver(attendee, {}, ctx),
				),
			);

			expect(results).toHaveLength(12);
			for (const result of results) {
				expect(result).toEqual({
					...sharedEvent,
					attachments: [],
				});
			}
		});

		it("should handle large event data without performance degradation", async () => {
			const largeEvent = {
				id: "event-456",
				name: "Large Event with Very Long Name ".repeat(50),
				description: "Large description ".repeat(200),
				location: "Large location data ".repeat(10),
				organizationId: "org-123",
			};

			ctx.dataloaders.event.load = vi.fn().mockResolvedValue(largeEvent);

			const result = await eventAttendeeEventResolver(
				mockEventAttendee,
				{},
				ctx,
			);

			expect(result).toEqual({
				...largeEvent,
				attachments: [],
			});
		});
	});

	describe("Database Recovery Scenarios", () => {
		it("should handle transient database failures", async () => {
			ctx.dataloaders.event.load = vi
				.fn()
				.mockRejectedValueOnce(new Error("Transient database error"))
				.mockResolvedValueOnce({
					id: "event-456",
					name: "Recovery Test Event",
					organizationId: "org-123",
				});

			// First call should fail
			await expect(
				eventAttendeeEventResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow("Transient database error");

			// Second call should succeed
			const result = await eventAttendeeEventResolver(
				mockEventAttendee,
				{},
				ctx,
			);
			expect(result).toBeDefined();
			expect(result?.id).toBe("event-456");
		});

		it("should handle database rollback scenarios", async () => {
			ctx.dataloaders.event.load = vi
				.fn()
				.mockRejectedValue(new Error("Transaction was rolled back"));

			await expect(
				eventAttendeeEventResolver(mockEventAttendee, {}, ctx),
			).rejects.toThrow("Transaction was rolled back");
		});
	});

	describe("Attachments Nullish Coalescing", () => {
		it("should return empty array when resolved instance has null attachments", async () => {
			const recurringAttendee = {
				...mockEventAttendee,
				eventId: null,
				recurringEventInstanceId: "instance-789",
			} as EventAttendeeType;

			// Updated: Fully independent mock object to avoid scoping issues
			// and explicitly test NULL attachments
			const instanceWithNullAttachments = {
				id: "instance-789",
				name: "Recurring Instance Event",
				description: "Instance description",
				location: "Instance location",
				actualStartTime: new Date("2024-03-15T09:00:00Z"),
				actualEndTime: new Date("2024-03-15T12:00:00Z"),
				organizationId: "org-123",
				baseRecurringEventId: "template-456",
				recurrenceRuleId: "rule-789",
				originalSeriesId: "series-123",
				originalInstanceStartTime: new Date("2024-03-15T09:00:00Z"),
				isCancelled: false,
				generatedAt: new Date("2024-03-01T00:00:00Z"),
				lastUpdatedAt: null,
				version: "1",
				sequenceNumber: 1,
				totalCount: 10,
				allDay: false,
				isPublic: true,
				isRegisterable: true,
				isInviteOnly: false,
				creatorId: "creator-123",
				updaterId: null,
				createdAt: new Date("2024-03-01T00:00:00Z"),
				updatedAt: null,
				hasExceptions: false,
				appliedExceptionData: null,
				exceptionCreatedBy: null,
				exceptionCreatedAt: null,
				// FIX: use 'as any' to allow testing NULL here
				// biome-ignore lint/suspicious/noExplicitAny: Testing null edge case
				attachments: null as any,
			};

			vi.mocked(getRecurringEventInstancesByIds).mockResolvedValue([
				instanceWithNullAttachments,
			]);

			const result = await eventAttendeeEventResolver(
				recurringAttendee,
				{},
				ctx,
			);

			expect(result?.attachments).toEqual([]);
		});
	});
});
