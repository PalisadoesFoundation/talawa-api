import { faker } from "@faker-js/faker";
import { and, eq } from "drizzle-orm";
import { afterEach, expect, type Mock, suite, test, vi } from "vitest";
import { eventsTable } from "~/src/drizzle/tables/events";
import { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import { generateInstancesForRecurringEvent } from "~/src/services/eventGeneration";
import type {
	GenerateInstancesInput,
	ServiceDependencies,
} from "~/src/services/eventGeneration/types";

afterEach(() => {
	vi.clearAllMocks();
});

suite("eventMaterialization", () => {
	const mockLogger = {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
		fatal: vi.fn(),
		trace: vi.fn(),
		silent: vi.fn(),
		child: vi.fn(() => mockLogger),
		level: "info",
	} as ServiceDependencies["logger"];

	const mockDrizzleClient = {
		query: {
			eventsTable: {
				findFirst: vi.fn(),
			},
			recurrenceRulesTable: {
				findFirst: vi.fn(),
			},
			eventExceptionsTable: {
				findMany: vi.fn(),
			},
			recurringEventInstancesTable: {
				findMany: vi.fn(),
			},
		},
		insert: vi.fn(() => ({
			values: vi.fn(),
		})),
	} as unknown as ServiceDependencies["drizzleClient"];

	suite("generateInstancesForRecurringEvent", () => {
		test("successfully materializes instances for a recurring event", async () => {
			const input: GenerateInstancesInput = {
				baseRecurringEventId: faker.string.uuid(),
				windowStartDate: new Date("2025-01-01"),
				windowEndDate: new Date("2025-12-31"),
				organizationId: faker.string.uuid(),
			};

			const mockBaseTemplate = {
				id: input.baseRecurringEventId,
				name: "Test Event",
				description: "Test Description",
				location: "Test Location",
				startAt: new Date("2025-01-01T10:00:00Z"),
				endAt: new Date("2025-01-01T11:00:00Z"),
				isRecurringEventTemplate: true,
				organizationId: input.organizationId,
				creatorId: faker.string.uuid(),
				isPublic: true,
				isRegisterable: true,
				allDay: false,
				createdAt: new Date("2025-01-01T00:00:00Z"),
				updatedAt: new Date("2025-01-01T00:00:00Z"),
			};

			const mockRecurrenceRule = {
				id: faker.string.uuid(),
				originalSeriesId: faker.string.uuid(),
				baseRecurringEventId: input.baseRecurringEventId,
				frequency: "WEEKLY",
				interval: 1,
				count: 10,
				recurrenceEndDate: null,
				recurrenceStartDate: new Date("2025-01-01T10:00:00Z"),
				byDay: ["MO", "WE", "FR"],
				byMonth: null,
				byMonthDay: null,
			};

			const mockExceptions = [
				{
					id: faker.string.uuid(),
					recurringEventId: input.baseRecurringEventId,
					instanceStartTime: new Date("2025-01-15T10:00:00Z"),
					exceptionData: { isCancelled: true },
					creatorId: faker.string.uuid(),
					createdAt: new Date("2025-01-01T00:00:00Z"),
				},
			];

			(mockDrizzleClient.query.eventsTable.findFirst as Mock).mockResolvedValue(
				mockBaseTemplate,
			);
			(
				mockDrizzleClient.query.recurrenceRulesTable.findFirst as Mock
			).mockResolvedValue(mockRecurrenceRule);
			(
				mockDrizzleClient.query.eventExceptionsTable.findMany as Mock
			).mockResolvedValue(mockExceptions);
			(
				mockDrizzleClient.query.recurringEventInstancesTable.findMany as Mock
			).mockResolvedValue([]);

			const result = await generateInstancesForRecurringEvent(
				input,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toBeGreaterThan(0);
			expect(
				mockDrizzleClient.query.eventsTable.findFirst,
			).toHaveBeenCalledWith({
				where: and(
					eq(eventsTable.id, input.baseRecurringEventId),
					eq(eventsTable.isRecurringEventTemplate, true),
					eq(eventsTable.organizationId, input.organizationId),
				),
			});
			expect(
				mockDrizzleClient.query.recurrenceRulesTable.findFirst,
			).toHaveBeenCalledWith({
				columns: {
					id: true,
					originalSeriesId: true,
					frequency: true,
					interval: true,
					recurrenceStartDate: true,
					recurrenceEndDate: true,
					count: true,
					byDay: true,
					byMonth: true,
					byMonthDay: true,
				},
				where: eq(
					recurrenceRulesTable.baseRecurringEventId,
					input.baseRecurringEventId,
				),
			});
		});

		test("throws error when base template is not found", async () => {
			const input: GenerateInstancesInput = {
				baseRecurringEventId: faker.string.uuid(),
				windowStartDate: new Date("2025-01-01"),
				windowEndDate: new Date("2025-12-31"),
				organizationId: faker.string.uuid(),
			};

			(mockDrizzleClient.query.eventsTable.findFirst as Mock).mockResolvedValue(
				null,
			);
			(
				mockDrizzleClient.query.recurrenceRulesTable.findFirst as Mock
			).mockResolvedValue({});

			await expect(
				generateInstancesForRecurringEvent(
					input,
					mockDrizzleClient,
					mockLogger,
				),
			).rejects.toThrow(
				`Base template or recurrence rule not found: ${input.baseRecurringEventId}`,
			);

			expect(mockLogger.error).toHaveBeenCalledWith(
				{ baseTemplate: false, recurrenceRule: true },
				`Base template or recurrence rule not found for ${input.baseRecurringEventId}`,
			);
		});

		test("throws error when recurrence rule is not found", async () => {
			const input: GenerateInstancesInput = {
				baseRecurringEventId: faker.string.uuid(),
				windowStartDate: new Date("2025-01-01"),
				windowEndDate: new Date("2025-12-31"),
				organizationId: faker.string.uuid(),
			};

			const mockBaseTemplate = {
				id: input.baseRecurringEventId,
				name: "Test Event",
				isRecurringEventTemplate: true,
				organizationId: input.organizationId,
				startAt: new Date("2025-01-01T10:00:00Z"),
				endAt: new Date("2025-01-01T11:00:00Z"),
			};

			(mockDrizzleClient.query.eventsTable.findFirst as Mock).mockResolvedValue(
				mockBaseTemplate,
			);
			(
				mockDrizzleClient.query.recurrenceRulesTable.findFirst as Mock
			).mockResolvedValue(null);

			await expect(
				generateInstancesForRecurringEvent(
					input,
					mockDrizzleClient,
					mockLogger,
				),
			).rejects.toThrow(
				`Base template or recurrence rule not found: ${input.baseRecurringEventId}`,
			);

			expect(mockLogger.error).toHaveBeenCalledWith(
				{ baseTemplate: true, recurrenceRule: false },
				`Base template or recurrence rule not found for ${input.baseRecurringEventId}`,
			);
		});

		test("returns 0 when no new instances need to be created", async () => {
			const input: GenerateInstancesInput = {
				baseRecurringEventId: faker.string.uuid(),
				windowStartDate: new Date("2025-01-01"),
				windowEndDate: new Date("2025-01-31"),
				organizationId: faker.string.uuid(),
			};

			const mockBaseTemplate = {
				id: input.baseRecurringEventId,
				name: "Test Event",
				startAt: new Date("2025-01-01T10:00:00Z"),
				endAt: new Date("2025-01-01T11:00:00Z"),
				isRecurringEventTemplate: true,
				organizationId: input.organizationId,
			};

			const mockRecurrenceRule = {
				id: faker.string.uuid(),
				originalSeriesId: faker.string.uuid(),
				baseRecurringEventId: input.baseRecurringEventId,
				frequency: "WEEKLY",
				interval: 1,
				count: 4,
				recurrenceEndDate: null,
				recurrenceStartDate: new Date("2025-01-01T10:00:00Z"),
			};

			// Mock existing instances that cover all calculated occurrences
			const mockExistingInstances = [
				{ originalInstanceStartTime: new Date("2025-01-01T10:00:00Z") },
				{ originalInstanceStartTime: new Date("2025-01-08T10:00:00Z") },
				{ originalInstanceStartTime: new Date("2025-01-15T10:00:00Z") },
				{ originalInstanceStartTime: new Date("2025-01-22T10:00:00Z") },
			];

			(mockDrizzleClient.query.eventsTable.findFirst as Mock).mockResolvedValue(
				mockBaseTemplate,
			);
			(
				mockDrizzleClient.query.recurrenceRulesTable.findFirst as Mock
			).mockResolvedValue(mockRecurrenceRule);
			(
				mockDrizzleClient.query.eventExceptionsTable.findMany as Mock
			).mockResolvedValue([]);
			(
				mockDrizzleClient.query.recurringEventInstancesTable.findMany as Mock
			).mockResolvedValue(mockExistingInstances);

			const result = await generateInstancesForRecurringEvent(
				input,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toBe(0);
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.stringContaining("No new instances to create"),
			);
		});

		test("logs detailed information about the materialization process", async () => {
			const input: GenerateInstancesInput = {
				baseRecurringEventId: faker.string.uuid(),
				windowStartDate: new Date("2025-01-01"),
				windowEndDate: new Date("2025-01-31"),
				organizationId: faker.string.uuid(),
			};

			const mockBaseTemplate = {
				id: input.baseRecurringEventId,
				name: "Test Event",
				startAt: new Date("2025-01-01T10:00:00Z"),
				endAt: new Date("2025-01-01T11:00:00Z"),
				isRecurringEventTemplate: true,
				organizationId: input.organizationId,
			};

			const mockRecurrenceRule = {
				id: faker.string.uuid(),
				originalSeriesId: faker.string.uuid(),
				baseRecurringEventId: input.baseRecurringEventId,
				frequency: "WEEKLY",
				interval: 1,
				count: 4,
				recurrenceEndDate: null,
				recurrenceStartDate: new Date("2025-01-01T10:00:00Z"),
			};

			(mockDrizzleClient.query.eventsTable.findFirst as Mock).mockResolvedValue(
				mockBaseTemplate,
			);
			(
				mockDrizzleClient.query.recurrenceRulesTable.findFirst as Mock
			).mockResolvedValue(mockRecurrenceRule);
			(
				mockDrizzleClient.query.eventExceptionsTable.findMany as Mock
			).mockResolvedValue([]);
			(
				mockDrizzleClient.query.recurringEventInstancesTable.findMany as Mock
			).mockResolvedValue([]);

			await generateInstancesForRecurringEvent(
				input,
				mockDrizzleClient,
				mockLogger,
			);

			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.objectContaining({
					frequency: "WEEKLY",
					originalCount: 4,
				}),
				expect.stringContaining("Generated"),
			);
		});

		test("handles database errors gracefully", async () => {
			const input: GenerateInstancesInput = {
				baseRecurringEventId: faker.string.uuid(),
				windowStartDate: new Date("2025-01-01"),
				windowEndDate: new Date("2025-12-31"),
				organizationId: faker.string.uuid(),
			};

			const dbError = new Error("Database connection failed");
			(mockDrizzleClient.query.eventsTable.findFirst as Mock).mockRejectedValue(
				dbError,
			);

			await expect(
				generateInstancesForRecurringEvent(
					input,
					mockDrizzleClient,
					mockLogger,
				),
			).rejects.toThrow("Database connection failed");

			expect(mockLogger.error).toHaveBeenCalledWith(
				dbError,
				`Failed to generate instances for ${input.baseRecurringEventId}:`,
			);
		});

		test("throws error if recurrence rule has null originalSeriesId", async () => {
			const input: GenerateInstancesInput = {
				baseRecurringEventId: faker.string.uuid(),
				windowStartDate: new Date("2025-01-01"),
				windowEndDate: new Date("2025-12-31"),
				organizationId: faker.string.uuid(),
			};

			const mockBaseTemplate = {
				id: input.baseRecurringEventId,
				name: "Test Event",
				startAt: new Date("2025-01-01T10:00:00Z"),
				endAt: new Date("2025-01-01T11:00:00Z"),
				isRecurringEventTemplate: true,
				organizationId: input.organizationId,
				creatorId: faker.string.uuid(),
				isPublic: true,
				isRegisterable: true,
				allDay: false,
				createdAt: new Date("2025-01-01T00:00:00Z"),
				updatedAt: new Date("2025-01-01T00:00:00Z"),
			};

			const mockRecurrenceRule = {
				id: faker.string.uuid(),
				originalSeriesId: null,
				baseRecurringEventId: input.baseRecurringEventId,
				frequency: "WEEKLY",
				interval: 1,
				count: 10,
				recurrenceEndDate: null,
				recurrenceStartDate: new Date("2025-01-01T10:00:00Z"),
				byDay: ["MO"],
				byMonth: null,
				byMonthDay: null,
			};

			(mockDrizzleClient.query.eventsTable.findFirst as Mock).mockResolvedValue(
				mockBaseTemplate,
			);
			(
				mockDrizzleClient.query.recurrenceRulesTable.findFirst as Mock
			).mockResolvedValue(mockRecurrenceRule);

			await expect(
				generateInstancesForRecurringEvent(
					input,
					mockDrizzleClient,
					mockLogger,
				),
			).rejects.toThrow(
				`Recurrence rule for ${input.baseRecurringEventId} has null originalSeriesId`,
			);

			expect(mockLogger.error).toHaveBeenCalledWith(
				{ recurrenceRuleId: mockRecurrenceRule.id },
				`Recurrence rule for ${input.baseRecurringEventId} has null originalSeriesId`,
			);
		});

		test("uses isNull/gte/lte(originalInstanceStartDate) query for all-day recurring events", async () => {
			const input: GenerateInstancesInput = {
				baseRecurringEventId: faker.string.uuid(),
				windowStartDate: new Date("2025-01-01"),
				windowEndDate: new Date("2025-01-31"),
				organizationId: faker.string.uuid(),
			};

			// All-day template: allDay=true with startDate/endDate instead of startAt/endAt
			const mockBaseTemplate = {
				id: input.baseRecurringEventId,
				name: "All-Day Weekly Event",
				startAt: null,
				endAt: null,
				startDate: "2025-01-01",
				endDate: "2025-01-02",
				isRecurringEventTemplate: true,
				organizationId: input.organizationId,
				allDay: true,
				creatorId: faker.string.uuid(),
				isPublic: true,
				isRegisterable: true,
				createdAt: new Date("2025-01-01T00:00:00Z"),
				updatedAt: new Date("2025-01-01T00:00:00Z"),
			};

			const mockRecurrenceRule = {
				id: faker.string.uuid(),
				originalSeriesId: faker.string.uuid(),
				baseRecurringEventId: input.baseRecurringEventId,
				frequency: "WEEKLY",
				interval: 1,
				count: 4,
				recurrenceEndDate: null,
				recurrenceStartDate: new Date("2025-01-01"),
				byDay: null,
				byMonth: null,
				byMonthDay: null,
			};

			(mockDrizzleClient.query.eventsTable.findFirst as Mock).mockResolvedValue(
				mockBaseTemplate,
			);
			(
				mockDrizzleClient.query.recurrenceRulesTable.findFirst as Mock
			).mockResolvedValue(mockRecurrenceRule);
			(
				mockDrizzleClient.query.eventExceptionsTable.findMany as Mock
			).mockResolvedValue([]);
			(
				mockDrizzleClient.query.recurringEventInstancesTable.findMany as Mock
			).mockResolvedValue([]);

			const result = await generateInstancesForRecurringEvent(
				input,
				mockDrizzleClient,
				mockLogger,
			);

			// Should create instances (all-day occurrences were generated and no duplicates exist)
			expect(result).toBeGreaterThan(0);
			// The isAllDay branch of the duplicate-check query was executed
			expect(
				mockDrizzleClient.query.recurringEventInstancesTable.findMany,
			).toHaveBeenCalled();
		});

		test("returns 0 when all-day instances already exist within the window", async () => {
			const input: GenerateInstancesInput = {
				baseRecurringEventId: faker.string.uuid(),
				windowStartDate: new Date("2025-01-01"),
				windowEndDate: new Date("2025-01-31"),
				organizationId: faker.string.uuid(),
			};

			const mockBaseTemplate = {
				id: input.baseRecurringEventId,
				name: "All-Day Weekly Event",
				startAt: null,
				endAt: null,
				startDate: "2025-01-01",
				endDate: "2025-01-02",
				isRecurringEventTemplate: true,
				organizationId: input.organizationId,
				allDay: true,
				creatorId: faker.string.uuid(),
				isPublic: true,
				isRegisterable: true,
				createdAt: new Date("2025-01-01T00:00:00Z"),
				updatedAt: new Date("2025-01-01T00:00:00Z"),
			};

			const mockRecurrenceRule = {
				id: faker.string.uuid(),
				originalSeriesId: faker.string.uuid(),
				baseRecurringEventId: input.baseRecurringEventId,
				frequency: "WEEKLY",
				interval: 1,
				count: 4,
				recurrenceEndDate: null,
				recurrenceStartDate: new Date("2025-01-01"),
				byDay: null,
				byMonth: null,
				byMonthDay: null,
			};

			// Return existing instances keyed by originalInstanceStartDate (all-day dedup path)
			const mockExistingInstances = [
				{
					originalInstanceStartTime: null,
					originalInstanceStartDate: "2025-01-01",
				},
				{
					originalInstanceStartTime: null,
					originalInstanceStartDate: "2025-01-08",
				},
				{
					originalInstanceStartTime: null,
					originalInstanceStartDate: "2025-01-15",
				},
				{
					originalInstanceStartTime: null,
					originalInstanceStartDate: "2025-01-22",
				},
			];

			(mockDrizzleClient.query.eventsTable.findFirst as Mock).mockResolvedValue(
				mockBaseTemplate,
			);
			(
				mockDrizzleClient.query.recurrenceRulesTable.findFirst as Mock
			).mockResolvedValue(mockRecurrenceRule);
			(
				mockDrizzleClient.query.eventExceptionsTable.findMany as Mock
			).mockResolvedValue([]);
			(
				mockDrizzleClient.query.recurringEventInstancesTable.findMany as Mock
			).mockResolvedValue(mockExistingInstances);

			const result = await generateInstancesForRecurringEvent(
				input,
				mockDrizzleClient,
				mockLogger,
			);

			expect(result).toBe(0);
			expect(mockLogger.info).toHaveBeenCalledWith(
				expect.stringContaining("No new instances to create"),
			);
		});
	});
});
