import { faker } from "@faker-js/faker";
import { afterEach, expect, suite, test, vi } from "vitest";
import type { eventAttachmentsTable } from "~/src/drizzle/tables/eventAttachments";
import type { eventsTable } from "~/src/drizzle/tables/events";
import type { eventExceptionsTable } from "~/src/drizzle/tables/recurringEventExceptions";
import type {
	ResolvedRecurringEventInstance,
	recurringEventInstancesTable,
} from "~/src/drizzle/tables/recurringEventInstances";
import {
	createExceptionKey,
	createExceptionLookupMap,
	createTemplateLookupMap,
	resolveInstanceWithInheritance,
	resolveMultipleInstances,
	validateResolvedInstance,
} from "~/src/services/eventGeneration/instanceResolver";
import type {
	ResolveInstanceInput,
	ServiceDependencies,
} from "~/src/services/eventGeneration/types";

afterEach(() => {
	vi.clearAllMocks();
});

type ResolvedEventInstance = ResolvedRecurringEventInstance;

suite("instanceResolver", () => {
	const mockLogger: ServiceDependencies["logger"] = {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
		fatal: vi.fn(),
		trace: vi.fn(),
		silent: vi.fn(),
		child: vi.fn(() => mockLogger),
		level: "info",
	};

	const mockGeneratedInstance = {
		id: faker.string.uuid(),
		baseRecurringEventId: faker.string.uuid(),
		recurrenceRuleId: faker.string.uuid(),
		originalInstanceStartTime: new Date("2025-01-01T10:00:00Z"),
		actualStartTime: new Date("2025-01-01T10:00:00Z"),
		actualEndTime: new Date("2025-01-01T11:00:00Z"),
		isCancelled: false,
		organizationId: faker.string.uuid(),
		generatedAt: new Date(),
		lastUpdatedAt: new Date(),
		version: "1",
		sequenceNumber: 1,
		totalCount: 10,
	} as typeof recurringEventInstancesTable.$inferSelect;

	const mockBaseTemplate = {
		id: faker.string.uuid(),
		name: "Test Event",
		description: "Test Description",
		location: "Test Location",
		allDay: false,
		isPublic: true,
		isRegisterable: true,
		creatorId: faker.string.uuid(),
		updaterId: faker.string.uuid(),
		createdAt: new Date(),
		updatedAt: new Date(),
		attachments: [],
	} as unknown as typeof eventsTable.$inferSelect & {
		attachments: (typeof eventAttachmentsTable.$inferSelect)[];
	};

	suite("resolveInstanceWithInheritance", () => {
		test("resolves instance with base template properties", () => {
			const input: ResolveInstanceInput = {
				generatedInstance: mockGeneratedInstance,
				baseTemplate: mockBaseTemplate,
			};

			const result = resolveInstanceWithInheritance(input);

			expect(result).toMatchObject({
				id: mockGeneratedInstance.id,
				baseRecurringEventId: mockGeneratedInstance.baseRecurringEventId,
				recurrenceRuleId: mockGeneratedInstance.recurrenceRuleId,
				originalInstanceStartTime:
					mockGeneratedInstance.originalInstanceStartTime,
				actualStartTime: mockGeneratedInstance.actualStartTime,
				actualEndTime: mockGeneratedInstance.actualEndTime,
				isCancelled: mockGeneratedInstance.isCancelled,
				organizationId: mockGeneratedInstance.organizationId,
				sequenceNumber: mockGeneratedInstance.sequenceNumber,
				totalCount: mockGeneratedInstance.totalCount,
				name: mockBaseTemplate.name,
				description: mockBaseTemplate.description,
				location: mockBaseTemplate.location,
				allDay: mockBaseTemplate.allDay,
				isPublic: mockBaseTemplate.isPublic,
				isRegisterable: mockBaseTemplate.isRegisterable,
				creatorId: mockBaseTemplate.creatorId,
				updaterId: mockBaseTemplate.updaterId,
				hasExceptions: false,
				appliedExceptionData: undefined,
				exceptionCreatedBy: null,
				exceptionCreatedAt: null,
			});
		});

		test("resolves instance with exception data applied", () => {
			const mockException = {
				id: faker.string.uuid(),
				recurringEventInstanceId: mockGeneratedInstance.id,
				baseRecurringEventId: mockGeneratedInstance.baseRecurringEventId,
				exceptionData: {
					name: "Modified Event Name",
					description: "Modified Description",
					location: "Modified Location",
					isCancelled: true,
				},
				organizationId: faker.string.uuid(),
				creatorId: faker.string.uuid(),
				updaterId: null,
				createdAt: new Date(),
				updatedAt: null,
			} as typeof eventExceptionsTable.$inferSelect;

			const input: ResolveInstanceInput = {
				generatedInstance: mockGeneratedInstance,
				baseTemplate: mockBaseTemplate,
				exception: mockException,
			};

			const result = resolveInstanceWithInheritance(input);

			expect(result).toMatchObject({
				name: "Modified Event Name",
				description: "Modified Description",
				location: "Modified Location",
				isCancelled: true,
				hasExceptions: true,
				appliedExceptionData: mockException.exceptionData,
				exceptionCreatedBy: mockException.creatorId,
				exceptionCreatedAt: mockException.createdAt,
			});
		});

		test("applies time-related exception data correctly", () => {
			const newStartTime = new Date("2025-01-01T14:00:00Z");
			const newEndTime = new Date("2025-01-01T15:00:00Z");

			const mockException = {
				id: faker.string.uuid(),
				recurringEventInstanceId: mockGeneratedInstance.id,
				baseRecurringEventId: mockGeneratedInstance.baseRecurringEventId,
				exceptionData: {
					startAt: newStartTime,
					endAt: newEndTime,
				},
				organizationId: faker.string.uuid(),
				creatorId: faker.string.uuid(),
				updaterId: null,
				createdAt: new Date(),
				updatedAt: null,
			} as typeof eventExceptionsTable.$inferSelect;

			const input: ResolveInstanceInput = {
				generatedInstance: mockGeneratedInstance,
				baseTemplate: mockBaseTemplate,
				exception: mockException,
			};

			const result = resolveInstanceWithInheritance(input);

			expect(result.actualStartTime).toEqual(newStartTime);
			expect(result.actualEndTime).toEqual(newEndTime);
		});

		test("ignores invalid exception fields", () => {
			const mockException = {
				id: faker.string.uuid(),
				recurringEventInstanceId: mockGeneratedInstance.id,
				baseRecurringEventId: mockGeneratedInstance.baseRecurringEventId,
				exceptionData: {
					name: "Modified Event Name",
					invalidField: "Should be ignored",
					id: "Should not override ID",
				},
				organizationId: faker.string.uuid(),
				creatorId: faker.string.uuid(),
				updaterId: null,
				createdAt: new Date(),
				updatedAt: null,
			} as typeof eventExceptionsTable.$inferSelect;

			const input: ResolveInstanceInput = {
				generatedInstance: mockGeneratedInstance,
				baseTemplate: mockBaseTemplate,
				exception: mockException,
			};

			const result = resolveInstanceWithInheritance(input);

			expect(result.name).toBe("Modified Event Name");
			expect(result.id).toBe(mockGeneratedInstance.id); // Should not be overridden
			expect(result).not.toHaveProperty("invalidField");
		});
	});

	suite("resolveMultipleInstances", () => {
		test("resolves multiple instances with templates and exceptions", () => {
			const instances = [mockGeneratedInstance];
			const templatesMap = new Map([
				[mockGeneratedInstance.baseRecurringEventId, mockBaseTemplate],
			]);
			const exceptionsMap = new Map();

			const result = resolveMultipleInstances(
				instances,
				templatesMap,
				exceptionsMap,
				mockLogger,
			);

			expect(result).toHaveLength(1);
			expect(result[0]).toMatchObject({
				id: mockGeneratedInstance.id,
				name: mockBaseTemplate.name,
				hasExceptions: false,
			});
		});

		test("skips instances without base templates", () => {
			const instances = [mockGeneratedInstance];
			const templatesMap = new Map(); // Empty map
			const exceptionsMap = new Map();

			const result = resolveMultipleInstances(
				instances,
				templatesMap,
				exceptionsMap,
				mockLogger,
			);

			expect(result).toHaveLength(0);
			expect(mockLogger.warn).toHaveBeenCalledWith(
				`Base template not found for instance ${mockGeneratedInstance.id}`,
			);
		});

		test("applies exceptions when found", () => {
			const mockException = {
				id: faker.string.uuid(),
				recurringEventInstanceId: mockGeneratedInstance.id,
				baseRecurringEventId: mockGeneratedInstance.baseRecurringEventId,
				exceptionData: { name: "Modified Event Name" },
				organizationId: faker.string.uuid(),
				creatorId: faker.string.uuid(),
				updaterId: null,
				createdAt: new Date(),
				updatedAt: null,
			} as typeof eventExceptionsTable.$inferSelect;

			const instances = [mockGeneratedInstance];
			const templatesMap = new Map([
				[mockGeneratedInstance.baseRecurringEventId, mockBaseTemplate],
			]);
			const exceptionsMap = new Map([
				[mockGeneratedInstance.id, mockException],
			]);

			const result = resolveMultipleInstances(
				instances,
				templatesMap,
				exceptionsMap,
				mockLogger,
			);

			expect(result).toHaveLength(1);
			expect(result[0]).toMatchObject({
				name: "Modified Event Name",
				hasExceptions: true,
			});
		});
	});

	suite("createExceptionKey", () => {
		test("creates consistent composite key from recurring event ID and instance start time", () => {
			const recurringEventId = faker.string.uuid();
			const instanceStartTime = new Date("2025-01-01T10:00:00Z");

			const key = createExceptionKey(recurringEventId, instanceStartTime);

			expect(key).toBe(
				`${recurringEventId}:${instanceStartTime.toISOString()}`,
			);
		});

		test("creates different keys for different parameters", () => {
			const recurringEventId1 = faker.string.uuid();
			const recurringEventId2 = faker.string.uuid();
			const instanceStartTime1 = new Date("2025-01-01T10:00:00Z");
			const instanceStartTime2 = new Date("2025-01-01T11:00:00Z");

			const key1 = createExceptionKey(recurringEventId1, instanceStartTime1);
			const key2 = createExceptionKey(recurringEventId2, instanceStartTime1);
			const key3 = createExceptionKey(recurringEventId1, instanceStartTime2);

			expect(key1).not.toBe(key2);
			expect(key1).not.toBe(key3);
			expect(key2).not.toBe(key3);
		});
	});

	suite("createExceptionLookupMap", () => {
		test("creates lookup map from exceptions array", () => {
			const exceptions = [
				{
					id: faker.string.uuid(),
					recurringEventInstanceId: faker.string.uuid(),
					exceptionData: { name: "Exception 1" },
					organizationId: faker.string.uuid(),
					creatorId: faker.string.uuid(),
					updaterId: null,
					createdAt: new Date(),
					updatedAt: null,
				},
				{
					id: faker.string.uuid(),
					recurringEventInstanceId: faker.string.uuid(),
					exceptionData: { name: "Exception 2" },
					organizationId: faker.string.uuid(),
					creatorId: faker.string.uuid(),
					updaterId: null,
					createdAt: new Date(),
					updatedAt: null,
				},
			] as (typeof eventExceptionsTable.$inferSelect)[];

			const map = createExceptionLookupMap(exceptions);

			expect(map.size).toBe(2);
			const exception1 = exceptions[0];
			const exception2 = exceptions[1];
			if (!exception1 || !exception2) {
				throw new Error("Test data is missing");
			}
			const key1 = exception1.recurringEventInstanceId;
			const key2 = exception2.recurringEventInstanceId;
			expect(map.get(key1)).toBe(exceptions[0]);
			expect(map.get(key2)).toBe(exceptions[1]);
		});

		test("handles empty exceptions array", () => {
			const map = createExceptionLookupMap([]);

			expect(map.size).toBe(0);
		});
	});

	suite("createTemplateLookupMap", () => {
		test("creates lookup map from templates array", () => {
			const templates = [
				{
					id: faker.string.uuid(),
					name: "Template 1",
					attachments: [],
				},
				{
					id: faker.string.uuid(),
					name: "Template 2",
					attachments: [],
				},
			] as unknown as (typeof eventsTable.$inferSelect & {
				attachments: (typeof eventAttachmentsTable.$inferSelect)[];
			})[];

			const map = createTemplateLookupMap(templates);

			const template1 = templates[0];
			const template2 = templates[1];
			if (!template1 || !template2) {
				throw new Error("Test data is missing");
			}
			expect(map.size).toBe(2);
			expect(map.get(template1.id)).toBe(template1);
			expect(map.get(template2.id)).toBe(template2);
		});

		test("handles empty templates array", () => {
			const map = createTemplateLookupMap([]);

			expect(map.size).toBe(0);
		});
	});

	suite("validateResolvedInstance", () => {
		test("returns true for valid resolved instance", () => {
			const validInstance: Partial<ResolvedEventInstance> = {
				id: faker.string.uuid(),
				baseRecurringEventId: faker.string.uuid(),
				originalSeriesId: faker.string.uuid(),
				originalInstanceStartTime: new Date(),
				actualStartTime: new Date(),
				actualEndTime: new Date(),
				organizationId: faker.string.uuid(),
				name: "Test Event",
			};

			const result = validateResolvedInstance(
				validInstance as ResolvedEventInstance,
				mockLogger,
			);

			expect(result).toBe(true);
		});

		test("returns false for instance missing required fields", () => {
			const invalidInstance: Partial<ResolvedEventInstance> = {
				id: faker.string.uuid(),
				baseRecurringEventId: faker.string.uuid(),
				// Missing originalSeriesId
				originalInstanceStartTime: new Date(),
				actualStartTime: new Date(),
				actualEndTime: new Date(),
				organizationId: faker.string.uuid(),
				name: "Test Event",
			};

			const result = validateResolvedInstance(
				invalidInstance as ResolvedEventInstance,
				mockLogger,
			);

			expect(result).toBe(false);
			expect(mockLogger.error).toHaveBeenCalledWith(
				"Missing required field in resolved instance: originalSeriesId",
			);
		});

		test("returns false for instance with undefined required fields", () => {
			const invalidInstance: Partial<ResolvedEventInstance> = {
				id: faker.string.uuid(),
				baseRecurringEventId: faker.string.uuid(),
				originalInstanceStartTime: new Date(),
				actualStartTime: new Date(),
				actualEndTime: new Date(),
				organizationId: faker.string.uuid(),
				name: "Test Event",
				originalSeriesId: undefined, // Undefined required field
			};

			const result = validateResolvedInstance(
				invalidInstance as ResolvedEventInstance,
				mockLogger,
			);

			expect(result).toBe(false);
			expect(mockLogger.error).toHaveBeenCalledWith(
				"Missing required field in resolved instance: originalSeriesId",
			);
		});
	});
});
