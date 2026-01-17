import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	type EventWithAttachments,
	type GetUnifiedEventsInput,
	getEventsByIds,
	getUnifiedEventsInDateRange,
} from "~/src/graphql/types/Query/eventQueries/unifiedEventQueries";
import type { ServiceDependencies } from "~/src/services/eventGeneration/types";

// Mock dependencies
vi.mock(
	"~/src/graphql/types/Query/eventQueries/standaloneEventQueries",
	() => ({
		getStandaloneEventsInDateRange: vi.fn(),
		getStandaloneEventsByIds: vi.fn(),
	}),
);

vi.mock(
	"~/src/graphql/types/Query/eventQueries/recurringEventInstanceQueries",
	() => ({
		getRecurringEventInstancesInDateRange: vi.fn(),
		getRecurringEventInstancesByIds: vi.fn(),
	}),
);

import type { ResolvedRecurringEventInstance } from "~/src/drizzle/tables/recurringEventInstances";
import {
	getRecurringEventInstancesByIds,
	getRecurringEventInstancesInDateRange,
} from "~/src/graphql/types/Query/eventQueries/recurringEventInstanceQueries";
import {
	getStandaloneEventsByIds,
	getStandaloneEventsInDateRange,
} from "~/src/graphql/types/Query/eventQueries/standaloneEventQueries";

const mockGetStandaloneEventsInDateRange = vi.mocked(
	getStandaloneEventsInDateRange,
);
const mockGetRecurringEventInstancesInDateRange = vi.mocked(
	getRecurringEventInstancesInDateRange,
);
const mockGetStandaloneEventsByIds = vi.mocked(getStandaloneEventsByIds);
const mockGetRecurringEventInstancesByIds = vi.mocked(
	getRecurringEventInstancesByIds,
);

describe("getUnifiedEventsInDateRange", () => {
	let mockDrizzleClient: ServiceDependencies["drizzleClient"];
	let mockLogger: ServiceDependencies["logger"];
	let baseInput: GetUnifiedEventsInput;

	const mockStandaloneEvent: EventWithAttachments = {
		id: "standalone-1",
		name: "Standalone Event",
		description: "A standalone event",
		startAt: new Date("2025-01-15T10:00:00.000Z"),
		endAt: new Date("2025-01-15T11:00:00.000Z"),
		location: "Conference Room",
		allDay: false,
		isPublic: true,
		isRegisterable: true,
		isInviteOnly: false,
		organizationId: "org-1",
		creatorId: "user-1",
		updaterId: null,
		createdAt: new Date("2025-01-01T00:00:00.000Z"),
		updatedAt: null,
		isRecurringEventTemplate: false,
		attachments: [],
		eventType: "standalone" as const,
	};

	const mockGeneratedInstance: ResolvedRecurringEventInstance = {
		// Core instance metadata
		id: "generated-1",
		baseRecurringEventId: "recurring-1",
		recurrenceRuleId: "rule-1",
		originalSeriesId: "series-1",
		originalInstanceStartTime: new Date("2025-01-16T14:00:00.000Z"),
		actualStartTime: new Date("2025-01-16T14:00:00.000Z"),
		actualEndTime: new Date("2025-01-16T15:00:00.000Z"),
		isCancelled: false,
		organizationId: "org-1",
		generatedAt: new Date("2025-01-01T00:00:00.000Z"),
		lastUpdatedAt: new Date("2025-01-02T00:00:00.000Z"),
		version: "1.0",

		// Sequence metadata
		sequenceNumber: 2,
		totalCount: 10,

		// Resolved event properties
		name: "Generated Event",
		description: "A generated event instance",
		location: "Meeting Room",
		allDay: false,
		isPublic: true,
		isRegisterable: false,
		isInviteOnly: false,
		creatorId: "user-1",
		updaterId: "user-2",
		createdAt: new Date("2025-01-01T00:00:00.000Z"),
		updatedAt: new Date("2025-01-02T00:00:00.000Z"),

		// Exception metadata
		hasExceptions: false,
		appliedExceptionData: null,
		exceptionCreatedBy: null,
		exceptionCreatedAt: null,
	};

	beforeEach(() => {
		// Reset all mocks
		vi.clearAllMocks();

		// Setup mock implementations
		mockDrizzleClient = {} as ServiceDependencies["drizzleClient"];
		mockLogger = {
			error: vi.fn(),
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			fatal: vi.fn(),
			trace: vi.fn(),
			silent: vi.fn(),
			child: vi.fn(),
			level: "info",
		} as ServiceDependencies["logger"];

		baseInput = {
			organizationId: "org-1",
			startDate: new Date("2025-01-01T00:00:00.000Z"),
			endDate: new Date("2025-01-31T23:59:59.000Z"),
		};

		// Default mock implementations
		mockGetStandaloneEventsInDateRange.mockResolvedValue([mockStandaloneEvent]);
		mockGetRecurringEventInstancesInDateRange.mockResolvedValue([
			mockGeneratedInstance,
		]);
		mockGetStandaloneEventsByIds.mockResolvedValue([]);
		mockGetRecurringEventInstancesByIds.mockResolvedValue([]);
	});

	// Helper function to create a complete ResolvedRecurringEventInstance
	const createMockGeneratedInstance = (
		overrides: Partial<ResolvedRecurringEventInstance> = {},
	): ResolvedRecurringEventInstance => ({
		...mockGeneratedInstance,
		...overrides,
	});

	describe("Input validation and parameters", () => {
		it("should handle default parameters correctly", async () => {
			const result = await getUnifiedEventsInDateRange(
				baseInput,
				mockDrizzleClient,
				mockLogger,
			);

			expect(mockGetStandaloneEventsInDateRange).toHaveBeenCalledWith(
				expect.objectContaining({
					organizationId: "org-1",
					startDate: baseInput.startDate,
					endDate: baseInput.endDate,
					limit: 1000, // default limit
				}),
				mockDrizzleClient,
				mockLogger,
			);

			expect(mockGetRecurringEventInstancesInDateRange).toHaveBeenCalledWith(
				expect.objectContaining({
					organizationId: "org-1",
					startDate: baseInput.startDate,
					endDate: baseInput.endDate,
					includeCancelled: false,
					limit: 1000, // default limit
				}),
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toHaveLength(2);
		});

		it("should respect includeRecurring = false", async () => {
			const input = { ...baseInput, includeRecurring: false };

			const result = await getUnifiedEventsInDateRange(
				input,
				mockDrizzleClient,
				mockLogger,
			);

			expect(mockGetStandaloneEventsInDateRange).toHaveBeenCalled();
			expect(mockGetRecurringEventInstancesInDateRange).not.toHaveBeenCalled();
			expect(result).toHaveLength(1);
			expect(result[0]?.eventType).toBe("standalone");
		});

		it("should respect custom limit parameter", async () => {
			const input = { ...baseInput, limit: 50 };

			await getUnifiedEventsInDateRange(input, mockDrizzleClient, mockLogger);

			expect(mockGetStandaloneEventsInDateRange).toHaveBeenCalledWith(
				expect.objectContaining({ limit: 50 }),
				mockDrizzleClient,
				mockLogger,
			);

			expect(mockGetRecurringEventInstancesInDateRange).toHaveBeenCalledWith(
				expect.objectContaining({ limit: 50 }),
				mockDrizzleClient,
				mockLogger,
			);
		});

		it("should handle undefined includeRecurring (defaults to true)", async () => {
			const input = { ...baseInput, includeRecurring: undefined };

			await getUnifiedEventsInDateRange(input, mockDrizzleClient, mockLogger);

			expect(mockGetStandaloneEventsInDateRange).toHaveBeenCalled();
			expect(mockGetRecurringEventInstancesInDateRange).toHaveBeenCalled();
		});

		it("should handle undefined limit (defaults to 1000)", async () => {
			const input = { ...baseInput, limit: undefined };

			await getUnifiedEventsInDateRange(input, mockDrizzleClient, mockLogger);

			expect(mockGetStandaloneEventsInDateRange).toHaveBeenCalledWith(
				expect.objectContaining({ limit: 1000 }),
				mockDrizzleClient,
				mockLogger,
			);
		});
	});

	describe("Standalone events integration", () => {
		it("should transform standalone events to unified format", async () => {
			const standaloneEvent = {
				...mockStandaloneEvent,
				id: "standalone-test",
				name: "Test Standalone",
			};
			mockGetStandaloneEventsInDateRange.mockResolvedValue([standaloneEvent]);
			mockGetRecurringEventInstancesInDateRange.mockResolvedValue([]);

			const result = await getUnifiedEventsInDateRange(
				baseInput,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				...standaloneEvent,
				eventType: "standalone",
			});
		});

		it("should handle empty standalone events", async () => {
			mockGetStandaloneEventsInDateRange.mockResolvedValue([]);
			mockGetRecurringEventInstancesInDateRange.mockResolvedValue([]);

			const result = await getUnifiedEventsInDateRange(
				baseInput,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toHaveLength(0);
		});

		it("should handle multiple standalone events", async () => {
			const events = [
				{ ...mockStandaloneEvent, id: "standalone-1" },
				{ ...mockStandaloneEvent, id: "standalone-2" },
				{ ...mockStandaloneEvent, id: "standalone-3" },
			];
			mockGetStandaloneEventsInDateRange.mockResolvedValue(events);
			mockGetRecurringEventInstancesInDateRange.mockResolvedValue([]);

			const result = await getUnifiedEventsInDateRange(
				baseInput,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toHaveLength(3);
			expect(result.every((event) => event.eventType === "standalone")).toBe(
				true,
			);
		});
	});

	describe("Recurring events integration", () => {
		it("should transform generated instances to unified format", async () => {
			mockGetStandaloneEventsInDateRange.mockResolvedValue([]);
			const generatedInstance = createMockGeneratedInstance({
				id: "generated-test",
				name: "Test Generated",
			});
			mockGetRecurringEventInstancesInDateRange.mockResolvedValue([
				generatedInstance,
			]);

			const result = await getUnifiedEventsInDateRange(
				baseInput,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toHaveLength(1);
			const transformedEvent = result[0];

			// Check core properties from generated instance
			expect(transformedEvent?.id).toBe("generated-test");
			expect(transformedEvent?.name).toBe("Test Generated");
			expect(transformedEvent?.startAt).toBe(generatedInstance.actualStartTime);
			expect(transformedEvent?.endAt).toBe(generatedInstance.actualEndTime);

			// Check unified format properties
			expect(transformedEvent?.eventType).toBe("generated");
			expect(transformedEvent?.isGenerated).toBe(true);
			expect(transformedEvent?.isRecurringEventTemplate).toBe(false);
			expect(transformedEvent?.baseRecurringEventId).toBe("recurring-1");
			expect(transformedEvent?.sequenceNumber).toBe(2);
			expect(transformedEvent?.totalCount).toBe(10);
			expect(transformedEvent?.hasExceptions).toBe(false);
			expect(transformedEvent?.attachments).toEqual([]);
		});

		it("should handle empty generated instances", async () => {
			mockGetStandaloneEventsInDateRange.mockResolvedValue([]);
			mockGetRecurringEventInstancesInDateRange.mockResolvedValue([]);

			const result = await getUnifiedEventsInDateRange(
				baseInput,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toHaveLength(0);
		});

		it("should handle multiple generated instances", async () => {
			mockGetStandaloneEventsInDateRange.mockResolvedValue([]);
			const instances = [
				{ ...mockGeneratedInstance, id: "generated-1", sequenceNumber: 1 },
				{ ...mockGeneratedInstance, id: "generated-2", sequenceNumber: 2 },
				{ ...mockGeneratedInstance, id: "generated-3", sequenceNumber: 3 },
			];
			mockGetRecurringEventInstancesInDateRange.mockResolvedValue(instances);

			const result = await getUnifiedEventsInDateRange(
				baseInput,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toHaveLength(3);
			expect(result.every((event) => event.eventType === "generated")).toBe(
				true,
			);
			expect(result.every((event) => event.isGenerated === true)).toBe(true);
		});
	});

	describe("Event transformation and unified format", () => {
		it("should properly map all generated instance properties", async () => {
			mockGetStandaloneEventsInDateRange.mockResolvedValue([]);
			const complexInstance = {
				...mockGeneratedInstance,
				description: "Complex description",
				location: "Complex location",
				allDay: true,
				isPublic: false,
				isRegisterable: true,
				hasExceptions: true,
				totalCount: null,
			};
			mockGetRecurringEventInstancesInDateRange.mockResolvedValue([
				complexInstance,
			]);

			const result = await getUnifiedEventsInDateRange(
				baseInput,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result[0]).toMatchObject({
				description: "Complex description",
				location: "Complex location",
				allDay: true,
				isPublic: false,
				isRegisterable: true,
				hasExceptions: true,
				totalCount: null,
				isRecurringEventTemplate: false,
				isGenerated: true,
				eventType: "generated",
				attachments: [],
			});
		});

		it("should handle both standalone and generated events together", async () => {
			const standaloneEvents = [
				{ ...mockStandaloneEvent, id: "standalone-1" },
				{ ...mockStandaloneEvent, id: "standalone-2" },
			];
			const generatedInstances = [
				{ ...mockGeneratedInstance, id: "generated-1" },
				{ ...mockGeneratedInstance, id: "generated-2" },
			];

			mockGetStandaloneEventsInDateRange.mockResolvedValue(standaloneEvents);
			mockGetRecurringEventInstancesInDateRange.mockResolvedValue(
				generatedInstances,
			);

			const result = await getUnifiedEventsInDateRange(
				baseInput,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toHaveLength(4);

			// Check that we have both types
			const standaloneCount = result.filter(
				(e) => e.eventType === "standalone",
			).length;
			const generatedCount = result.filter(
				(e) => e.eventType === "generated",
			).length;

			expect(standaloneCount).toBe(2);
			expect(generatedCount).toBe(2);
		});
	});

	describe("Sorting and limiting logic", () => {
		it("should sort events by start time", async () => {
			const event1 = {
				...mockStandaloneEvent,
				id: "event1",
				startAt: new Date("2025-01-15T10:00:00.000Z"),
			};
			const event2 = {
				...mockStandaloneEvent,
				id: "event2",
				startAt: new Date("2025-01-10T10:00:00.000Z"),
			};
			const instance1 = {
				...mockGeneratedInstance,
				id: "instance1",
				actualStartTime: new Date("2025-01-20T10:00:00.000Z"),
			};
			const instance2 = {
				...mockGeneratedInstance,
				id: "instance2",
				actualStartTime: new Date("2025-01-05T10:00:00.000Z"),
			};

			mockGetStandaloneEventsInDateRange.mockResolvedValue([event1, event2]);
			mockGetRecurringEventInstancesInDateRange.mockResolvedValue([
				instance1,
				instance2,
			]);

			const result = await getUnifiedEventsInDateRange(
				baseInput,
				mockDrizzleClient,
				mockLogger,
			);

			// Should be sorted by start time: instance2, event2, event1, instance1
			expect(result[0]?.id).toBe("instance2");
			expect(result[1]?.id).toBe("event2");
			expect(result[2]?.id).toBe("event1");
			expect(result[3]?.id).toBe("instance1");
		});

		it("should sort by ID when start times are identical", async () => {
			const sameStartTime = new Date("2025-01-15T10:00:00.000Z");
			const event1 = {
				...mockStandaloneEvent,
				id: "z-event",
				startAt: sameStartTime,
			};
			const event2 = {
				...mockStandaloneEvent,
				id: "a-event",
				startAt: sameStartTime,
			};

			mockGetStandaloneEventsInDateRange.mockResolvedValue([event1, event2]);
			mockGetRecurringEventInstancesInDateRange.mockResolvedValue([]);

			const result = await getUnifiedEventsInDateRange(
				baseInput,
				mockDrizzleClient,
				mockLogger,
			);

			// Should be sorted by ID: a-event, z-event
			expect(result[0]?.id).toBe("a-event");
			expect(result[1]?.id).toBe("z-event");
		});

		it("should apply limit after sorting", async () => {
			const standaloneEvents = Array.from({ length: 5 }, (_, i) => ({
				...mockStandaloneEvent,
				id: `standalone-${i}`,
				startAt: new Date(`2025-01-${10 + i}T10:00:00.000Z`),
			}));

			const generatedInstances = Array.from({ length: 5 }, (_, i) => ({
				...mockGeneratedInstance,
				id: `generated-${i}`,
				actualStartTime: new Date(`2025-01-${15 + i}T10:00:00.000Z`),
			}));

			mockGetStandaloneEventsInDateRange.mockResolvedValue(standaloneEvents);
			mockGetRecurringEventInstancesInDateRange.mockResolvedValue(
				generatedInstances,
			);

			const result = await getUnifiedEventsInDateRange(
				{ ...baseInput, limit: 7 },
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toHaveLength(7);
			// Should get first 5 standalone events and first 2 generated instances
			expect(
				result.slice(0, 5).every((e) => e.eventType === "standalone"),
			).toBe(true);
			expect(result.slice(5, 7).every((e) => e.eventType === "generated")).toBe(
				true,
			);
		});

		it("should not apply limit when total events are within limit", async () => {
			const standaloneEvents = [mockStandaloneEvent];
			const generatedInstances = [mockGeneratedInstance];

			mockGetStandaloneEventsInDateRange.mockResolvedValue(standaloneEvents);
			mockGetRecurringEventInstancesInDateRange.mockResolvedValue(
				generatedInstances,
			);

			const result = await getUnifiedEventsInDateRange(
				{ ...baseInput, limit: 10 },
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toHaveLength(2);
		});

		it("should handle limit of 0", async () => {
			mockGetStandaloneEventsInDateRange.mockResolvedValue([
				mockStandaloneEvent,
			]);
			mockGetRecurringEventInstancesInDateRange.mockResolvedValue([
				mockGeneratedInstance,
			]);

			const result = await getUnifiedEventsInDateRange(
				{ ...baseInput, limit: 0 },
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toHaveLength(0);
		});
	});

	describe("Error handling", () => {
		it("should handle standalone events query failure", async () => {
			const error = new Error("Standalone query failed");
			mockGetStandaloneEventsInDateRange.mockRejectedValue(error);

			await expect(
				getUnifiedEventsInDateRange(baseInput, mockDrizzleClient, mockLogger),
			).rejects.toThrow("Standalone query failed");

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					organizationId: "org-1",
					error,
				}),
				"Failed to get unified events",
			);
		});

		it("should handle recurring events query failure", async () => {
			const error = new Error("Recurring query failed");
			mockGetStandaloneEventsInDateRange.mockResolvedValue([]);
			mockGetRecurringEventInstancesInDateRange.mockRejectedValue(error);

			await expect(
				getUnifiedEventsInDateRange(baseInput, mockDrizzleClient, mockLogger),
			).rejects.toThrow("Recurring query failed");

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					organizationId: "org-1",
					error,
				}),
				"Failed to get unified events",
			);
		});

		it("should handle unexpected errors during processing", async () => {
			// Mock to throw during transformation
			mockGetStandaloneEventsInDateRange.mockResolvedValue([
				mockStandaloneEvent,
			]);
			mockGetRecurringEventInstancesInDateRange.mockResolvedValue([
				mockGeneratedInstance,
			]);

			// Mock a property that will cause an error during sort
			const corruptedEvent = { ...mockStandaloneEvent };
			Object.defineProperty(corruptedEvent, "startAt", {
				get() {
					throw new Error("Invalid date access");
				},
			});
			mockGetStandaloneEventsInDateRange.mockResolvedValue([corruptedEvent]);

			await expect(
				getUnifiedEventsInDateRange(baseInput, mockDrizzleClient, mockLogger),
			).rejects.toThrow("Invalid date access");

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					organizationId: "org-1",
				}),
				"Failed to get unified events",
			);
		});

		it("should preserve original error when rethrowing", async () => {
			const customError = new Error("Custom error message");
			customError.name = "CustomError";
			mockGetStandaloneEventsInDateRange.mockRejectedValue(customError);

			try {
				await getUnifiedEventsInDateRange(
					baseInput,
					mockDrizzleClient,
					mockLogger,
				);
			} catch (error) {
				expect(error).toBe(customError);
				expect((error as Error).name).toBe("CustomError");
				expect((error as Error).message).toBe("Custom error message");
			}
		});
	});

	describe("Integration scenarios", () => {
		it("should handle mixed date ranges and edge cases", async () => {
			const edgeStartTime = new Date("2025-01-01T00:00:00.000Z");
			const edgeEndTime = new Date("2025-01-31T23:59:59.999Z");

			const event = {
				...mockStandaloneEvent,
				startAt: edgeStartTime,
				endAt: edgeEndTime,
			};

			mockGetStandaloneEventsInDateRange.mockResolvedValue([event]);
			mockGetRecurringEventInstancesInDateRange.mockResolvedValue([]);

			const result = await getUnifiedEventsInDateRange(
				baseInput,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toHaveLength(1);
			expect(result[0]?.startAt).toBe(edgeStartTime);
		});

		it("should handle events with null/undefined properties", async () => {
			const eventWithNulls: EventWithAttachments = {
				...mockStandaloneEvent,
				description: null,
				location: null,
				updaterId: null,
				updatedAt: null,
			};

			const instanceWithNulls = {
				...mockGeneratedInstance,
				description: null,
				location: null,
				totalCount: null,
			};

			mockGetStandaloneEventsInDateRange.mockResolvedValue([eventWithNulls]);
			mockGetRecurringEventInstancesInDateRange.mockResolvedValue([
				instanceWithNulls,
			]);

			const result = await getUnifiedEventsInDateRange(
				baseInput,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toHaveLength(2);
			expect(result[0]?.description).toBe(null);
			expect(result[1]?.totalCount).toBe(null);
		});

		it("should handle large datasets efficiently", async () => {
			const largeStandaloneArray = Array.from({ length: 500 }, (_, i) => ({
				...mockStandaloneEvent,
				id: `standalone-${i}`,
				startAt: new Date(
					`2025-01-01T${String(i % 24).padStart(2, "0")}:00:00.000Z`,
				),
			}));

			const largeGeneratedArray = Array.from({ length: 500 }, (_, i) => ({
				...mockGeneratedInstance,
				id: `generated-${i}`,
				actualStartTime: new Date(
					`2025-01-15T${String(i % 24).padStart(2, "0")}:00:00.000Z`,
				),
			}));

			mockGetStandaloneEventsInDateRange.mockResolvedValue(
				largeStandaloneArray,
			);
			mockGetRecurringEventInstancesInDateRange.mockResolvedValue(
				largeGeneratedArray,
			);

			const start = Date.now();
			const result = await getUnifiedEventsInDateRange(
				{ ...baseInput, limit: 1000 },
				mockDrizzleClient,
				mockLogger,
			);
			const duration = Date.now() - start;

			expect(result).toHaveLength(1000);
			expect(duration).toBeLessThan(1000); // Should complete within 1 second
		});
	});
});

describe("getEventsByIds", () => {
	let mockDrizzleClient: ServiceDependencies["drizzleClient"];
	let mockLogger: ServiceDependencies["logger"];

	const mockStandaloneEvent: EventWithAttachments = {
		id: "standalone-1",
		name: "Standalone Event",
		description: "A standalone event",
		startAt: new Date("2025-01-15T10:00:00.000Z"),
		endAt: new Date("2025-01-15T11:00:00.000Z"),
		location: "Conference Room",
		allDay: false,
		isPublic: true,
		isRegisterable: true,
		isInviteOnly: false,
		organizationId: "org-1",
		creatorId: "user-1",
		updaterId: null,
		createdAt: new Date("2025-01-01T00:00:00.000Z"),
		updatedAt: null,
		isRecurringEventTemplate: false,
		attachments: [],
		eventType: "standalone" as const,
	};

	const mockResolvedInstance: ResolvedRecurringEventInstance = {
		// Core instance metadata
		id: "generated-1",
		baseRecurringEventId: "recurring-1",
		recurrenceRuleId: "rule-1",
		originalSeriesId: "series-1",
		originalInstanceStartTime: new Date("2025-01-16T14:00:00.000Z"),
		actualStartTime: new Date("2025-01-16T14:00:00.000Z"),
		actualEndTime: new Date("2025-01-16T15:00:00.000Z"),
		isCancelled: false,
		organizationId: "org-1",
		generatedAt: new Date("2025-01-01T00:00:00.000Z"),
		lastUpdatedAt: new Date("2025-01-02T00:00:00.000Z"),
		version: "1.0",

		// Sequence metadata
		sequenceNumber: 2,
		totalCount: 10,

		// Resolved event properties
		name: "Generated Event",
		description: "A generated event instance",
		location: "Meeting Room",
		allDay: false,
		isPublic: true,
		isRegisterable: false,
		isInviteOnly: false,
		creatorId: "user-1",
		updaterId: "user-2",
		createdAt: new Date("2025-01-01T00:00:00.000Z"),
		updatedAt: new Date("2025-01-02T00:00:00.000Z"),

		// Exception metadata
		hasExceptions: false,
		appliedExceptionData: null,
		exceptionCreatedBy: null,
		exceptionCreatedAt: null,
	};

	beforeEach(() => {
		vi.clearAllMocks();

		mockDrizzleClient = {} as ServiceDependencies["drizzleClient"];
		mockLogger = {
			error: vi.fn(),
			debug: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			fatal: vi.fn(),
			trace: vi.fn(),
			silent: vi.fn(),
			child: vi.fn(),
			level: "info",
		} as ServiceDependencies["logger"];

		// Default mock implementations
		mockGetStandaloneEventsByIds.mockResolvedValue([]);
		mockGetRecurringEventInstancesByIds.mockResolvedValue([]);
	});

	describe("Basic functionality", () => {
		it("should return empty array when no event IDs provided", async () => {
			const result = await getEventsByIds([], mockDrizzleClient, mockLogger);

			expect(result).toHaveLength(0);
			expect(mockGetStandaloneEventsByIds).toHaveBeenCalledWith(
				[],
				mockDrizzleClient,
				mockLogger,
				{ includeTemplates: true },
			);
		});

		it("should return standalone events when found", async () => {
			const eventIds = ["standalone-1"];
			mockGetStandaloneEventsByIds.mockResolvedValue([mockStandaloneEvent]);

			const result = await getEventsByIds(
				eventIds,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toHaveLength(1);
			expect(result[0]?.eventType).toBe("standalone");
			expect(result[0]?.isGenerated).toBe(false);
			expect(result[0]?.id).toBe("standalone-1");

			// Should not call recurring instance query since all IDs were found
			expect(mockGetRecurringEventInstancesByIds).not.toHaveBeenCalled();
		});

		it("should return generated events when not found as standalone", async () => {
			const eventIds = ["generated-1"];
			mockGetStandaloneEventsByIds.mockResolvedValue([]);
			mockGetRecurringEventInstancesByIds.mockResolvedValue([
				mockResolvedInstance,
			]);

			const result = await getEventsByIds(
				eventIds,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toHaveLength(1);
			expect(result[0]?.eventType).toBe("generated");
			expect(result[0]?.isGenerated).toBe(true);
			expect(result[0]?.id).toBe("generated-1");
			expect(result[0]?.baseRecurringEventId).toBe("recurring-1");
			expect(result[0]?.sequenceNumber).toBe(2);
		});

		it("should handle mixed standalone and generated events", async () => {
			const eventIds = ["standalone-1", "generated-1"];
			mockGetStandaloneEventsByIds.mockResolvedValue([mockStandaloneEvent]);
			mockGetRecurringEventInstancesByIds.mockResolvedValue([
				mockResolvedInstance,
			]);

			const result = await getEventsByIds(
				eventIds,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toHaveLength(2);

			const standaloneEvents = result.filter(
				(e) => e.eventType === "standalone",
			);
			const generatedEvents = result.filter((e) => e.eventType === "generated");

			expect(standaloneEvents).toHaveLength(1);
			expect(generatedEvents).toHaveLength(1);

			expect(mockGetRecurringEventInstancesByIds).toHaveBeenCalledWith(
				["generated-1"], // only the remaining IDs
				mockDrizzleClient,
				mockLogger,
			);
		});
	});

	describe("Event transformation", () => {
		it("should correctly transform generated events to unified format", async () => {
			const eventIds = ["generated-1"];
			mockGetRecurringEventInstancesByIds.mockResolvedValue([
				mockResolvedInstance,
			]);

			const result = await getEventsByIds(
				eventIds,
				mockDrizzleClient,
				mockLogger,
			);

			const transformedEvent = result[0];

			// Core properties should be mapped correctly
			expect(transformedEvent?.id).toBe(mockResolvedInstance.id);
			expect(transformedEvent?.name).toBe(mockResolvedInstance.name);
			expect(transformedEvent?.description).toBe(
				mockResolvedInstance.description,
			);
			expect(transformedEvent?.startAt).toBe(
				mockResolvedInstance.actualStartTime,
			);
			expect(transformedEvent?.endAt).toBe(mockResolvedInstance.actualEndTime);
			expect(transformedEvent?.location).toBe(mockResolvedInstance.location);
			expect(transformedEvent?.allDay).toBe(mockResolvedInstance.allDay);
			expect(transformedEvent?.isPublic).toBe(mockResolvedInstance.isPublic);
			expect(transformedEvent?.isRegisterable).toBe(
				mockResolvedInstance.isRegisterable,
			);
			expect(transformedEvent?.organizationId).toBe(
				mockResolvedInstance.organizationId,
			);
			expect(transformedEvent?.creatorId).toBe(mockResolvedInstance.creatorId);
			expect(transformedEvent?.updaterId).toBe(mockResolvedInstance.updaterId);
			expect(transformedEvent?.createdAt).toBe(mockResolvedInstance.createdAt);
			expect(transformedEvent?.updatedAt).toBe(mockResolvedInstance.updatedAt);

			// Generated event specific properties
			expect(transformedEvent?.isRecurringEventTemplate).toBe(false);
			expect(transformedEvent?.baseRecurringEventId).toBe(
				mockResolvedInstance.baseRecurringEventId,
			);
			expect(transformedEvent?.sequenceNumber).toBe(
				mockResolvedInstance.sequenceNumber,
			);
			expect(transformedEvent?.totalCount).toBe(
				mockResolvedInstance.totalCount,
			);
			expect(transformedEvent?.hasExceptions).toBe(
				mockResolvedInstance.hasExceptions,
			);
			expect(transformedEvent?.attachments).toEqual([]);
			expect(transformedEvent?.eventType).toBe("generated");
			expect(transformedEvent?.isGenerated).toBe(true);
		});
	});

	describe("Remaining IDs filtering", () => {
		it("should filter out found standalone event IDs from recurring query", async () => {
			const eventIds = ["standalone-1", "generated-1", "standalone-2"];
			const standaloneEvent2 = { ...mockStandaloneEvent, id: "standalone-2" };

			mockGetStandaloneEventsByIds.mockResolvedValue([
				mockStandaloneEvent,
				standaloneEvent2,
			]);
			mockGetRecurringEventInstancesByIds.mockResolvedValue([
				mockResolvedInstance,
			]);

			await getEventsByIds(eventIds, mockDrizzleClient, mockLogger);

			expect(mockGetRecurringEventInstancesByIds).toHaveBeenCalledWith(
				["generated-1"], // only the ID not found in standalone
				mockDrizzleClient,
				mockLogger,
			);
		});

		it("should not call recurring query when all IDs found as standalone", async () => {
			const eventIds = ["standalone-1"];
			mockGetStandaloneEventsByIds.mockResolvedValue([mockStandaloneEvent]);

			await getEventsByIds(eventIds, mockDrizzleClient, mockLogger);

			expect(mockGetRecurringEventInstancesByIds).not.toHaveBeenCalled();
		});

		it("should handle remainingIds.length > 0 condition correctly", async () => {
			const eventIds = ["generated-1", "generated-2"];
			mockGetStandaloneEventsByIds.mockResolvedValue([]);

			const mockResolvedInstance2 = {
				...mockResolvedInstance,
				id: "generated-2",
			};
			mockGetRecurringEventInstancesByIds.mockResolvedValue([
				mockResolvedInstance,
				mockResolvedInstance2,
			]);

			const result = await getEventsByIds(
				eventIds,
				mockDrizzleClient,
				mockLogger,
			);

			expect(mockGetRecurringEventInstancesByIds).toHaveBeenCalledWith(
				eventIds, // all IDs since none found as standalone
				mockDrizzleClient,
				mockLogger,
			);
			expect(result).toHaveLength(2);
		});
	});

	describe("Logging and debugging", () => {
		it("should log debug information about retrieved events", async () => {
			const eventIds = ["standalone-1", "generated-1"];
			mockGetStandaloneEventsByIds.mockResolvedValue([mockStandaloneEvent]);
			mockGetRecurringEventInstancesByIds.mockResolvedValue([
				mockResolvedInstance,
			]);

			await getEventsByIds(eventIds, mockDrizzleClient, mockLogger);

			expect(mockLogger.debug).toHaveBeenCalledWith(
				{
					requestedIds: 2,
					foundStandalone: 1,
					foundGenerated: 1,
					totalFound: 2,
				},
				"Retrieved events by IDs",
			);
		});
	});

	describe("Error handling", () => {
		it("should handle standalone events query failure", async () => {
			const eventIds = ["standalone-1"];
			const error = new Error("Standalone query failed");
			mockGetStandaloneEventsByIds.mockRejectedValue(error);

			await expect(
				getEventsByIds(eventIds, mockDrizzleClient, mockLogger),
			).rejects.toThrow("Standalone query failed");

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					eventIds,
					error,
				}),
				"Failed to get events by IDs",
			);
		});

		it("should handle recurring events query failure", async () => {
			const eventIds = ["generated-1"];
			const error = new Error("Recurring query failed");
			mockGetStandaloneEventsByIds.mockResolvedValue([]);
			mockGetRecurringEventInstancesByIds.mockRejectedValue(error);

			await expect(
				getEventsByIds(eventIds, mockDrizzleClient, mockLogger),
			).rejects.toThrow("Recurring query failed");

			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					eventIds,
					error,
				}),
				"Failed to get events by IDs",
			);
		});

		it("should preserve original error when rethrowing", async () => {
			const eventIds = ["standalone-1"];
			const customError = new Error("Custom error message");
			customError.name = "CustomError";
			mockGetStandaloneEventsByIds.mockRejectedValue(customError);

			try {
				await getEventsByIds(eventIds, mockDrizzleClient, mockLogger);
			} catch (error) {
				expect(error).toBe(customError);
				expect((error as Error).name).toBe("CustomError");
				expect((error as Error).message).toBe("Custom error message");
			}
		});
	});

	describe("Edge cases", () => {
		it("should handle empty found events", async () => {
			const eventIds = ["non-existent-1", "non-existent-2"];
			mockGetStandaloneEventsByIds.mockResolvedValue([]);
			mockGetRecurringEventInstancesByIds.mockResolvedValue([]);

			const result = await getEventsByIds(
				eventIds,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toHaveLength(0);
			expect(mockLogger.debug).toHaveBeenCalledWith(
				{
					requestedIds: 2,
					foundStandalone: 0,
					foundGenerated: 0,
					totalFound: 0,
				},
				"Retrieved events by IDs",
			);
		});

		it("should handle null/undefined properties in resolved instances", async () => {
			const instanceWithNulls = {
				...mockResolvedInstance,
				description: null,
				location: null,
				updaterId: null,
				totalCount: null,
			};

			const eventIds = ["generated-1"];
			mockGetRecurringEventInstancesByIds.mockResolvedValue([
				instanceWithNulls,
			]);

			const result = await getEventsByIds(
				eventIds,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result[0]?.description).toBe(null);
			expect(result[0]?.location).toBe(null);
			expect(result[0]?.updaterId).toBe(null);
			expect(result[0]?.totalCount).toBe(null);
		});
	});
});
