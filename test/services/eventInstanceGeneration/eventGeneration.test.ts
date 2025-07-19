import { faker } from "@faker-js/faker";
import { and, eq } from "drizzle-orm";
import { type Mock, expect, suite, test, vi } from "vitest";
import { eventExceptionsTable } from "~/src/drizzle/tables/eventExceptions";
import { eventsTable } from "~/src/drizzle/tables/events";
import { recurrenceRulesTable } from "~/src/drizzle/tables/recurrenceRules";
import { generateInstancesForRecurringEvent } from "~/src/services/eventGeneration";
import type {
	GenerateInstancesInput,
	ServiceDependencies,
} from "~/src/services/eventGeneration/types";

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
				isRecurringTemplate: true,
				organizationId: input.organizationId,
				creatorId: faker.string.uuid(),
				isPublic: true,
				isRegisterable: true,
				allDay: false,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			const mockRecurrenceRule = {
				id: faker.string.uuid(),
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
					createdAt: new Date(),
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
					eq(eventsTable.isRecurringTemplate, true),
					eq(eventsTable.organizationId, input.organizationId),
				),
			});
			expect(
				mockDrizzleClient.query.recurrenceRulesTable.findFirst,
			).toHaveBeenCalledWith({
				where: eq(
					recurrenceRulesTable.baseRecurringEventId,
					input.baseRecurringEventId,
				),
			});
			expect(
				mockDrizzleClient.query.eventExceptionsTable.findMany,
			).toHaveBeenCalledWith({
				where: eq(
					eventExceptionsTable.recurringEventId,
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
				`Base template or recurrence rule not found for ${input.baseRecurringEventId}`,
				{ baseTemplate: false, recurrenceRule: true },
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
				isRecurringTemplate: true,
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
				`Base template or recurrence rule not found for ${input.baseRecurringEventId}`,
				{ baseTemplate: true, recurrenceRule: false },
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
				isRecurringTemplate: true,
				organizationId: input.organizationId,
			};

			const mockRecurrenceRule = {
				id: faker.string.uuid(),
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
				isRecurringTemplate: true,
				organizationId: input.organizationId,
			};

			const mockRecurrenceRule = {
				id: faker.string.uuid(),
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
				expect.stringContaining("Generated"),
				expect.objectContaining({
					frequency: "WEEKLY",
					originalCount: 4,
				}),
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
				`Failed to generate instances for ${input.baseRecurringEventId}:`,
				dbError,
			);
		});
	});
});
