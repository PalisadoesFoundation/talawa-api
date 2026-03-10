import { beforeEach, describe, expect, it, vi } from "vitest";
import type { eventAttendeesTable } from "~/src/drizzle/tables/eventAttendees";
import type { ResolvedRecurringEventInstance } from "~/src/drizzle/tables/recurringEventInstances";
import {
	getRecurringEventInstancesByIds,
	getRecurringEventInstancesInDateRange,
} from "~/src/graphql/types/Query/eventQueries/recurringEventInstanceQueries";
import {
	getStandaloneEventsByIds,
	getStandaloneEventsInDateRange,
} from "~/src/graphql/types/Query/eventQueries/standaloneEventQueries";
import {
	type EventWithAttachments,
	filterInviteOnlyEvents,
	getEventsByIds,
	getUnifiedEventsInDateRange,
} from "~/src/graphql/types/Query/eventQueries/unifiedEventQueries";
import type { ServiceDependencies } from "~/src/services/eventGeneration/types";

// Mock dependencies
const mockDrizzleClient = {
	query: {
		eventAttendeesTable: {
			findMany: vi.fn(),
		},
	},
} as unknown as ServiceDependencies["drizzleClient"];

const mockLogger = {
	error: vi.fn(),
	info: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
} as unknown as ServiceDependencies["logger"];

vi.mock(
	"~/src/graphql/types/Query/eventQueries/standaloneEventQueries",
	() => ({
		getStandaloneEventsByIds: vi.fn(),
		getStandaloneEventsInDateRange: vi.fn(),
	}),
);

vi.mock(
	"~/src/graphql/types/Query/eventQueries/recurringEventInstanceQueries",
	() => ({
		getRecurringEventInstancesByIds: vi.fn(),
		getRecurringEventInstancesInDateRange: vi.fn(),
	}),
);

describe("unifiedEventQueries", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("getEventsByIds", () => {
		it("should preserve recurring event template properties when returning templates", async () => {
			const templateId = "template-1";
			const mockTemplateEvent = {
				id: templateId,
				name: "Recurring Template",
				isRecurringEventTemplate: true,
				eventType: "standalone",
				baseRecurringEventId: null,
			};

			vi.mocked(getStandaloneEventsByIds).mockResolvedValueOnce([
				mockTemplateEvent as unknown as EventWithAttachments,
			]);

			const result = await getEventsByIds(
				[templateId],
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toHaveLength(1);
			expect(result[0]?.id).toBe(templateId);
			expect(result[0]?.isRecurringEventTemplate).toBe(true);
			expect(result[0]?.isGenerated).toBe(false);

			expect(getStandaloneEventsByIds).toHaveBeenCalledWith(
				[templateId],
				mockDrizzleClient,
				mockLogger,
				{ includeTemplates: true },
			);
		});

		it("should fetch both standalone events and generated instances", async () => {
			const standaloneId = "standalone-1";
			const instanceId = "instance-1";

			const mockStandalone = {
				id: standaloneId,
				name: "Standalone",
				eventType: "standalone",
			};

			const mockInstance = {
				id: instanceId,
				name: "Instance",
				baseRecurringEventId: "base-1",
				actualStartTime: new Date(),
				actualEndTime: new Date(),
			};

			vi.mocked(getStandaloneEventsByIds).mockResolvedValueOnce([
				mockStandalone as unknown as EventWithAttachments,
			]);

			vi.mocked(getRecurringEventInstancesByIds).mockResolvedValueOnce([
				mockInstance as unknown as ResolvedRecurringEventInstance,
			]);

			const result = await getEventsByIds(
				[standaloneId, instanceId],
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toHaveLength(2);
			const standaloneResult = result.find((e) => e.id === standaloneId);
			const instanceResult = result.find((e) => e.id === instanceId);

			expect(standaloneResult).toBeDefined();
			expect(standaloneResult?.eventType).toBe("standalone");
			expect(standaloneResult?.isGenerated).toBe(false);

			expect(instanceResult).toBeDefined();
			// Instances are mapped to "generated" in getEventsByIds via mapRecurringInstanceToEvent logic inside
			// (actually mapRecurringInstanceToEvent sets isGenerated=true and eventType="generated" implicitly/explicitly)
			expect(instanceResult?.isGenerated).toBe(true); // mapRecurringInstanceToEvent sets this
		});

		it("should handle errors gracefully", async () => {
			const error = new Error("Database error");
			vi.mocked(getStandaloneEventsByIds).mockRejectedValueOnce(error);

			await expect(
				getEventsByIds(["id-1"], mockDrizzleClient, mockLogger),
			).rejects.toThrow(error);

			expect(mockLogger.error).toHaveBeenCalled();
		});
	});

	describe("getUnifiedEventsInDateRange", () => {
		it("should fetch and combine standalone and recurring events", async () => {
			const input = {
				organizationId: "org-1",
				startDate: new Date(),
				endDate: new Date(),
				includeRecurring: true,
				limit: 10,
			};

			const mockStandalone = {
				id: "standalone-1",
				startAt: new Date("2023-01-01T10:00:00Z"),
			};
			const mockInstance = {
				id: "instance-1",
				actualStartTime: new Date("2023-01-01T12:00:00Z"),
				actualEndTime: new Date("2023-01-01T13:00:00Z"),
				baseRecurringEventId: "base-1",
			};

			vi.mocked(getStandaloneEventsInDateRange).mockResolvedValueOnce([
				mockStandalone as unknown as EventWithAttachments,
			]);
			vi.mocked(getRecurringEventInstancesInDateRange).mockResolvedValueOnce([
				mockInstance as unknown as ResolvedRecurringEventInstance,
			]);

			const result = await getUnifiedEventsInDateRange(
				input,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toHaveLength(2);
			expect(result[0]?.id).toBe("standalone-1"); // Earlier
			expect(result[1]?.id).toBe("instance-1"); // Later

			expect(result[0]?.eventType).toBe("standalone");
			expect(result[1]?.eventType).toBe("generated");
		});

		it("should respect limit across both types", async () => {
			const input = {
				organizationId: "org-1",
				startDate: new Date(),
				endDate: new Date(),
				limit: 1, // Only 1 event total
			};

			const mockStandalone = {
				id: "standalone-1",
				startAt: new Date("2023-01-01T10:00:00Z"),
			};
			const mockInstance = {
				id: "instance-1",
				actualStartTime: new Date("2023-01-01T09:00:00Z"), // Earlier than standalone
				actualEndTime: new Date(),
				baseRecurringEventId: "base-1",
			};

			vi.mocked(getStandaloneEventsInDateRange).mockResolvedValueOnce([
				mockStandalone as unknown as EventWithAttachments,
			]);
			vi.mocked(getRecurringEventInstancesInDateRange).mockResolvedValueOnce([
				mockInstance as unknown as ResolvedRecurringEventInstance,
			]);

			const result = await getUnifiedEventsInDateRange(
				input,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toHaveLength(1);
			expect(result[0]?.id).toBe("instance-1"); // Should be the earlier one
		});

		it("should handle error", async () => {
			vi.mocked(getStandaloneEventsInDateRange).mockRejectedValueOnce(
				new Error("Fail"),
			);
			await expect(
				getUnifiedEventsInDateRange(
					{
						organizationId: "org",
						startDate: new Date(),
						endDate: new Date(),
					},
					mockDrizzleClient,
					mockLogger,
				),
			).rejects.toThrow("Fail");
			expect(mockLogger.error).toHaveBeenCalled();
		});

		it("should sort all-day events using startDate when startAt is null", async () => {
			const input = {
				organizationId: "org-1",
				startDate: new Date(),
				endDate: new Date(),
			};

			const allDayStandalone = {
				id: "all-day-1",
				startAt: null,
				startDate: "2023-01-01",
			};
			const timedInstance = {
				id: "instance-1",
				actualStartTime: new Date("2023-01-02T09:00:00Z"),
				actualEndTime: new Date("2023-01-02T10:00:00Z"),
				baseRecurringEventId: "base-1",
			};

			vi.mocked(getStandaloneEventsInDateRange).mockResolvedValueOnce([
				allDayStandalone as unknown as EventWithAttachments,
			]);
			vi.mocked(getRecurringEventInstancesInDateRange).mockResolvedValueOnce([
				timedInstance as unknown as ResolvedRecurringEventInstance,
			]);

			const result = await getUnifiedEventsInDateRange(
				input,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toHaveLength(2);
			expect(result[0]?.id).toBe("all-day-1");
			expect(result[1]?.id).toBe("instance-1");
		});

		it("should fall back to 0 when both startAt and startDate are missing", async () => {
			const input = {
				organizationId: "org-1",
				startDate: new Date(),
				endDate: new Date(),
			};

			const noDateEvent = {
				id: "no-date-event",
				startAt: null,
				startDate: null,
			};
			const datedEvent = {
				id: "dated-event",
				startAt: new Date("2023-01-01T10:00:00Z"),
			};

			vi.mocked(getStandaloneEventsInDateRange).mockResolvedValueOnce([
				noDateEvent as unknown as EventWithAttachments,
				datedEvent as unknown as EventWithAttachments,
			]);
			vi.mocked(getRecurringEventInstancesInDateRange).mockResolvedValueOnce(
				[],
			);

			const result = await getUnifiedEventsInDateRange(
				input,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toHaveLength(2);
			expect(result[0]?.id).toBe("no-date-event");
			expect(result[1]?.id).toBe("dated-event");
		});

		it("should use id localeCompare when computed times are equal from startAt", async () => {
			const input = {
				organizationId: "org-1",
				startDate: new Date(),
				endDate: new Date(),
			};

			const sameStartAt = new Date("2023-01-01T10:00:00Z");
			const eventB = {
				id: "b-event",
				startAt: sameStartAt,
			};
			const eventA = {
				id: "a-event",
				startAt: sameStartAt,
			};

			vi.mocked(getStandaloneEventsInDateRange).mockResolvedValueOnce([
				eventB as unknown as EventWithAttachments,
				eventA as unknown as EventWithAttachments,
			]);
			vi.mocked(getRecurringEventInstancesInDateRange).mockResolvedValueOnce(
				[],
			);

			const result = await getUnifiedEventsInDateRange(
				input,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toHaveLength(2);
			expect(result[0]?.id).toBe("a-event");
			expect(result[1]?.id).toBe("b-event");
		});

		it("should use id localeCompare when computed times are equal from startDate", async () => {
			const input = {
				organizationId: "org-1",
				startDate: new Date(),
				endDate: new Date(),
			};

			const eventZ = {
				id: "z-event",
				startAt: null,
				startDate: "2023-01-05",
			};
			const eventM = {
				id: "m-event",
				startAt: null,
				startDate: "2023-01-05",
			};

			vi.mocked(getStandaloneEventsInDateRange).mockResolvedValueOnce([
				eventZ as unknown as EventWithAttachments,
				eventM as unknown as EventWithAttachments,
			]);
			vi.mocked(getRecurringEventInstancesInDateRange).mockResolvedValueOnce(
				[],
			);

			const result = await getUnifiedEventsInDateRange(
				input,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toHaveLength(2);
			expect(result[0]?.id).toBe("m-event");
			expect(result[1]?.id).toBe("z-event");
		});
	});

	describe("filterInviteOnlyEvents", () => {
		it("should return all events if none are invite-only", async () => {
			const events = [
				{ id: "e1", isInviteOnly: false },
				{ id: "e2", isInviteOnly: false },
			] as EventWithAttachments[];

			const result = await filterInviteOnlyEvents({
				events,
				currentUserId: "user-1",
				currentUserRole: "regular",
				currentUserOrgMembership: undefined,
				drizzleClient: mockDrizzleClient,
			});

			expect(result).toHaveLength(2);
		});

		it("should return invite-only events where user is creator", async () => {
			const events = [
				{ id: "e1", isInviteOnly: true, creatorId: "user-1" }, // Creator
				{ id: "e2", isInviteOnly: true, creatorId: "user-2" }, // Not creator
			] as EventWithAttachments[];

			const result = await filterInviteOnlyEvents({
				events,
				currentUserId: "user-1",
				currentUserRole: "regular",
				currentUserOrgMembership: undefined,
				drizzleClient: mockDrizzleClient,
			});

			expect(result).toHaveLength(1);
			expect(result[0]?.id).toBe("e1");
		});

		it("should return invite-only events where user is admin", async () => {
			const events = [
				{
					id: "e1",
					isInviteOnly: true,
					creatorId: "user-2",
					organizationId: "org-1",
				},
			] as EventWithAttachments[];

			const result = await filterInviteOnlyEvents({
				events,
				currentUserId: "user-1",
				currentUserRole: "administrator", // Global admin
				currentUserOrgMembership: undefined,
				drizzleClient: mockDrizzleClient,
			});

			expect(result).toHaveLength(1);
		});

		it("should return invite-only events where user is invited/registered", async () => {
			const events = [
				{
					id: "standalone-1",
					eventType: "standalone",
					isInviteOnly: true,
					creatorId: "other",
					organizationId: "org-1",
				},
				{
					id: "instance-1",
					eventType: "generated",
					isInviteOnly: true,
					creatorId: "other",
					organizationId: "org-1",
				},
			] as EventWithAttachments[];

			// Mock findMany to return attendees matching these events
			vi.mocked(
				mockDrizzleClient.query.eventAttendeesTable.findMany,
			).mockResolvedValueOnce([
				// For standalone
				{
					eventId: "standalone-1",
				} as unknown as typeof eventAttendeesTable.$inferSelect,
			]);

			vi.mocked(
				mockDrizzleClient.query.eventAttendeesTable.findMany,
			).mockResolvedValueOnce([
				// For instance
				{
					recurringEventInstanceId: "instance-1",
				} as unknown as typeof eventAttendeesTable.$inferSelect,
			]);

			const result = await filterInviteOnlyEvents({
				events,
				currentUserId: "user-1",
				currentUserRole: "regular",
				currentUserOrgMembership: { role: "regular" },
				drizzleClient: mockDrizzleClient,
			});

			expect(result).toHaveLength(2);
		});
	});
});
