import { beforeEach, describe, expect, it, vi } from "vitest";
import type { eventsTable } from "~/src/drizzle/tables/events";
import type { eventExceptionsTable } from "~/src/drizzle/tables/recurringEventExceptions";
import type { ResolvedRecurringEventInstance } from "~/src/drizzle/tables/recurringEventInstances";
import type { recurringEventInstancesTable } from "~/src/drizzle/tables/recurringEventInstances";
import {
	type GetRecurringEventInstancesInput,
	getRecurringEventInstanceById,
	getRecurringEventInstancesByIds,
	getRecurringEventInstancesInDateRange,
} from "~/src/graphql/types/Query/eventQueries/recurringEventInstanceQueries";
import type { ServiceDependencies } from "~/src/services/eventGeneration/types";

// Mock the service dependencies
vi.mock("~/src/services/eventGeneration/instanceResolver", () => ({
	createExceptionLookupMap: vi.fn(),
	createTemplateLookupMap: vi.fn(),
	resolveInstanceWithInheritance: vi.fn(),
	resolveMultipleInstances: vi.fn(),
}));

import {
	createExceptionLookupMap,
	createTemplateLookupMap,
	resolveInstanceWithInheritance,
	resolveMultipleInstances,
} from "~/src/services/eventGeneration/instanceResolver";

const mockCreateExceptionLookupMap = vi.mocked(createExceptionLookupMap);
const mockCreateTemplateLookupMap = vi.mocked(createTemplateLookupMap);
const mockResolveInstanceWithInheritance = vi.mocked(
	resolveInstanceWithInheritance,
);
const mockResolveMultipleInstances = vi.mocked(resolveMultipleInstances);

// Shared test data
const mockRawInstance: typeof recurringEventInstancesTable.$inferSelect = {
	id: "instance-1",
	baseRecurringEventId: "base-event-1",
	recurrenceRuleId: "rule-1",
	originalSeriesId: "series-1",
	originalInstanceStartTime: new Date("2025-01-15T10:00:00.000Z"),
	actualStartTime: new Date("2025-01-15T10:00:00.000Z"),
	actualEndTime: new Date("2025-01-15T11:00:00.000Z"),
	isCancelled: false,
	organizationId: "org-1",
	generatedAt: new Date("2025-01-01T00:00:00.000Z"),
	lastUpdatedAt: new Date("2025-01-02T00:00:00.000Z"),
	version: "1.0",
	sequenceNumber: 1,
	totalCount: 10,
};

const mockBaseTemplate: typeof eventsTable.$inferSelect = {
	id: "base-event-1",
	name: "Base Recurring Event",
	description: "A base template for recurring events",
	startAt: new Date("2025-01-15T10:00:00.000Z"),
	endAt: new Date("2025-01-15T11:00:00.000Z"),
	location: "Main Hall",
	allDay: false,
	isPublic: true,
	isRegisterable: true,
	organizationId: "org-1",
	creatorId: "user-1",
	updaterId: null,
	createdAt: new Date("2025-01-01T00:00:00.000Z"),
	updatedAt: null,
	isRecurringEventTemplate: true,
};

const mockException: typeof eventExceptionsTable.$inferSelect = {
	id: "exception-1",
	recurringEventInstanceId: "instance-1",
	organizationId: "org-1",
	exceptionData: { modified: true },
	creatorId: "user-2",
	updaterId: "user-3",
	createdAt: new Date("2025-01-03T00:00:00.000Z"),
	updatedAt: new Date("2025-01-04T00:00:00.000Z"),
};

const mockResolvedInstance: ResolvedRecurringEventInstance = {
	id: "instance-1",
	baseRecurringEventId: "base-event-1",
	recurrenceRuleId: "rule-1",
	originalSeriesId: "series-1",
	originalInstanceStartTime: new Date("2025-01-15T10:00:00.000Z"),
	actualStartTime: new Date("2025-01-15T11:00:00.000Z"),
	actualEndTime: new Date("2025-01-15T12:00:00.000Z"),
	isCancelled: false,
	organizationId: "org-1",
	generatedAt: new Date("2025-01-01T00:00:00.000Z"),
	lastUpdatedAt: new Date("2025-01-02T00:00:00.000Z"),
	version: "1.0",
	sequenceNumber: 1,
	totalCount: 10,
	name: "Modified Event Name",
	description: "Modified description",
	location: "Different Room",
	allDay: false,
	isPublic: false,
	isRegisterable: false,
	creatorId: "user-1",
	updaterId: "user-3",
	createdAt: new Date("2025-01-01T00:00:00.000Z"),
	updatedAt: new Date("2025-01-04T00:00:00.000Z"),
	hasExceptions: true,
	appliedExceptionData: { modified: true },
	exceptionCreatedBy: "user-2",
	exceptionCreatedAt: new Date("2025-01-03T00:00:00.000Z"),
};

function setupMockDrizzleClient(): ServiceDependencies["drizzleClient"] {
	return {
		query: {
			recurringEventInstancesTable: {
				findMany: vi.fn(),
				findFirst: vi.fn(),
			},
			eventsTable: {
				findMany: vi.fn(),
				findFirst: vi.fn(),
			},
			eventExceptionsTable: {
				findMany: vi.fn(),
				findFirst: vi.fn(),
			},
		},
	} as unknown as ServiceDependencies["drizzleClient"];
}

function setupMockLogger(): ServiceDependencies["logger"] {
	return {
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
}

describe("getRecurringEventInstancesInDateRange", () => {
	let mockDrizzleClient: ServiceDependencies["drizzleClient"];
	let mockLogger: ServiceDependencies["logger"];
	let baseInput: GetRecurringEventInstancesInput;

	beforeEach(() => {
		vi.clearAllMocks();
		mockDrizzleClient = setupMockDrizzleClient();
		mockLogger = setupMockLogger();

		baseInput = {
			organizationId: "org-1",
			startDate: new Date("2025-01-01T00:00:00.000Z"),
			endDate: new Date("2025-01-31T23:59:59.000Z"),
		};

		// Default mock implementations
		vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).mockResolvedValue([mockRawInstance]);
		vi.mocked(mockDrizzleClient.query.eventsTable.findMany).mockResolvedValue([
			mockBaseTemplate,
		]);
		vi.mocked(
			mockDrizzleClient.query.eventExceptionsTable.findMany,
		).mockResolvedValue([mockException]);

		mockCreateTemplateLookupMap.mockReturnValue(
			new Map([["base-event-1", mockBaseTemplate]]),
		);
		mockCreateExceptionLookupMap.mockReturnValue(
			new Map([["instance-1", mockException]]),
		);
		mockResolveMultipleInstances.mockReturnValue([mockResolvedInstance]);
	});

	it("should handle parameters correctly and return resolved instances", async () => {
		// Test default parameters
		const result = await getRecurringEventInstancesInDateRange(
			baseInput,
			mockDrizzleClient,
			mockLogger,
		);

		expect(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).toHaveBeenCalledWith({
			where: expect.any(Object),
			orderBy: expect.any(Array),
			limit: 1000, // default limit
		});
		expect(result).toHaveLength(1);
		expect(result[0]).toBe(mockResolvedInstance);

		// Test custom parameters in same test
		const customInput = { ...baseInput, includeCancelled: true, limit: 50 };
		await getRecurringEventInstancesInDateRange(
			customInput,
			mockDrizzleClient,
			mockLogger,
		);

		expect(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).toHaveBeenLastCalledWith({
			where: expect.any(Object),
			orderBy: expect.any(Array),
			limit: 50,
		});
	});

	it("should handle empty instances and skip unnecessary processing", async () => {
		vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).mockResolvedValue([]);

		const result = await getRecurringEventInstancesInDateRange(
			baseInput,
			mockDrizzleClient,
			mockLogger,
		);

		expect(result).toEqual([]);
		// Should skip template/exception fetching when no instances
		expect(mockDrizzleClient.query.eventsTable.findMany).not.toHaveBeenCalled();
		expect(
			mockDrizzleClient.query.eventExceptionsTable.findMany,
		).not.toHaveBeenCalled();
		expect(mockResolveMultipleInstances).not.toHaveBeenCalled();
	});

	it("should fetch templates and exceptions in parallel and resolve instances", async () => {
		const result = await getRecurringEventInstancesInDateRange(
			baseInput,
			mockDrizzleClient,
			mockLogger,
		);

		// Verify parallel fetching
		expect(mockDrizzleClient.query.eventsTable.findMany).toHaveBeenCalledWith({
			where: expect.any(Object),
		});
		expect(
			mockDrizzleClient.query.eventExceptionsTable.findMany,
		).toHaveBeenCalledWith({
			where: expect.any(Object),
		});

		// Verify resolution with correct parameters
		expect(mockCreateTemplateLookupMap).toHaveBeenCalledWith([
			mockBaseTemplate,
		]);
		expect(mockCreateExceptionLookupMap).toHaveBeenCalledWith([mockException]);
		expect(mockResolveMultipleInstances).toHaveBeenCalledWith(
			[mockRawInstance],
			expect.any(Map),
			expect.any(Map),
			mockLogger,
		);
		expect(result).toHaveLength(1);
	});

	it("should handle multiple instances and various error scenarios", async () => {
		// Test multiple instances
		const instance1 = { ...mockRawInstance, id: "instance-1" };
		const instance2 = { ...mockRawInstance, id: "instance-2" };
		const resolved1 = { ...mockResolvedInstance, id: "instance-1" };
		const resolved2 = { ...mockResolvedInstance, id: "instance-2" };

		vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).mockResolvedValue([instance1, instance2]);
		mockResolveMultipleInstances.mockReturnValue([resolved1, resolved2]);

		const result = await getRecurringEventInstancesInDateRange(
			baseInput,
			mockDrizzleClient,
			mockLogger,
		);

		expect(result).toHaveLength(2);
		expect(result[0]?.id).toBe("instance-1");
		expect(result[1]?.id).toBe("instance-2");

		// Test error handling in same test
		const error = new Error("Database query failed");
		vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).mockRejectedValue(error);

		await expect(
			getRecurringEventInstancesInDateRange(
				baseInput,
				mockDrizzleClient,
				mockLogger,
			),
		).rejects.toThrow("Database query failed");

		expect(mockLogger.error).toHaveBeenCalledWith(
			"Failed to get recurring event instances for organization org-1:",
			error,
		);
	});

	it("should handle different error sources and preserve error details", async () => {
		// Reset to successful instance fetch
		vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).mockResolvedValue([mockRawInstance]);

		// Test template error
		const templateError = new Error("Templates query failed");
		vi.mocked(mockDrizzleClient.query.eventsTable.findMany).mockRejectedValue(
			templateError,
		);

		await expect(
			getRecurringEventInstancesInDateRange(
				baseInput,
				mockDrizzleClient,
				mockLogger,
			),
		).rejects.toThrow("Templates query failed");

		// Test exception error
		vi.mocked(mockDrizzleClient.query.eventsTable.findMany).mockResolvedValue([
			mockBaseTemplate,
		]);
		const exceptionError = new Error("Exceptions query failed");
		vi.mocked(
			mockDrizzleClient.query.eventExceptionsTable.findMany,
		).mockRejectedValue(exceptionError);

		await expect(
			getRecurringEventInstancesInDateRange(
				baseInput,
				mockDrizzleClient,
				mockLogger,
			),
		).rejects.toThrow("Exceptions query failed");

		// Test resolution error
		vi.mocked(
			mockDrizzleClient.query.eventExceptionsTable.findMany,
		).mockResolvedValue([mockException]);
		const resolutionError = new Error("Resolution failed");
		mockResolveMultipleInstances.mockImplementation(() => {
			throw resolutionError;
		});

		await expect(
			getRecurringEventInstancesInDateRange(
				baseInput,
				mockDrizzleClient,
				mockLogger,
			),
		).rejects.toThrow("Resolution failed");
	});
});

describe("getRecurringEventInstanceById", () => {
	let mockDrizzleClient: ServiceDependencies["drizzleClient"];
	let mockLogger: ServiceDependencies["logger"];

	beforeEach(() => {
		vi.clearAllMocks();
		mockDrizzleClient = setupMockDrizzleClient();
		mockLogger = setupMockLogger();

		// Default mock implementations
		vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findFirst,
		).mockResolvedValue(mockRawInstance);
		vi.mocked(mockDrizzleClient.query.eventsTable.findFirst).mockResolvedValue(
			mockBaseTemplate,
		);
		vi.mocked(
			mockDrizzleClient.query.eventExceptionsTable.findFirst,
		).mockResolvedValue(mockException);

		mockResolveInstanceWithInheritance.mockReturnValue(mockResolvedInstance);
	});

	it("should query with correct parameters and return resolved instance", async () => {
		const result = await getRecurringEventInstanceById(
			"instance-1",
			"org-1",
			mockDrizzleClient,
			mockLogger,
		);

		// Verify correct query parameters
		expect(
			mockDrizzleClient.query.recurringEventInstancesTable.findFirst,
		).toHaveBeenCalledWith({
			where: expect.any(Object), // and(eq(id, instanceId), eq(organizationId, organizationId))
		});
		expect(mockDrizzleClient.query.eventsTable.findFirst).toHaveBeenCalledWith({
			where: expect.any(Object), // eq(eventsTable.id, instance.baseRecurringEventId)
		});
		expect(
			mockDrizzleClient.query.eventExceptionsTable.findFirst,
		).toHaveBeenCalledWith({
			where: expect.any(Object), // eq(eventExceptionsTable.recurringEventInstanceId, instance.id)
		});

		expect(mockResolveInstanceWithInheritance).toHaveBeenCalledWith({
			generatedInstance: mockRawInstance,
			baseTemplate: mockBaseTemplate,
			exception: mockException,
		});

		expect(result).toBe(mockResolvedInstance);
	});

	it("should return null when instance not found", async () => {
		vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findFirst,
		).mockResolvedValue(undefined);

		const result = await getRecurringEventInstanceById(
			"non-existent",
			"org-1",
			mockDrizzleClient,
			mockLogger,
		);

		expect(result).toBeNull();
		// Should not proceed to base template or exception queries
		expect(
			mockDrizzleClient.query.eventsTable.findFirst,
		).not.toHaveBeenCalled();
		expect(
			mockDrizzleClient.query.eventExceptionsTable.findFirst,
		).not.toHaveBeenCalled();
		expect(mockResolveInstanceWithInheritance).not.toHaveBeenCalled();
	});

	it("should throw error when base template not found", async () => {
		vi.mocked(mockDrizzleClient.query.eventsTable.findFirst).mockResolvedValue(
			undefined,
		);

		await expect(
			getRecurringEventInstanceById(
				"instance-1",
				"org-1",
				mockDrizzleClient,
				mockLogger,
			),
		).rejects.toThrow("Base template not found: base-event-1");

		expect(mockLogger.error).toHaveBeenCalledWith(
			"Failed to get recurring event instance instance-1:",
			expect.any(Error),
		);
	});

	it("should handle missing exception and resolve without it", async () => {
		vi.mocked(
			mockDrizzleClient.query.eventExceptionsTable.findFirst,
		).mockResolvedValue(undefined);

		const resolvedWithoutException = {
			...mockResolvedInstance,
			hasExceptions: false,
			appliedExceptionData: null,
			exceptionCreatedBy: null,
			exceptionCreatedAt: null,
		};
		mockResolveInstanceWithInheritance.mockReturnValue(
			resolvedWithoutException,
		);

		const result = await getRecurringEventInstanceById(
			"instance-1",
			"org-1",
			mockDrizzleClient,
			mockLogger,
		);

		expect(mockResolveInstanceWithInheritance).toHaveBeenCalledWith({
			generatedInstance: mockRawInstance,
			baseTemplate: mockBaseTemplate,
			exception: null,
		});

		expect(result?.hasExceptions).toBe(false);
	});

	it("should handle various error scenarios with proper logging", async () => {
		// Instance query failure
		const instanceError = new Error("Instance query failed");
		vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findFirst,
		).mockRejectedValue(instanceError);

		await expect(
			getRecurringEventInstanceById(
				"instance-1",
				"org-1",
				mockDrizzleClient,
				mockLogger,
			),
		).rejects.toThrow("Instance query failed");

		expect(mockLogger.error).toHaveBeenCalledWith(
			"Failed to get recurring event instance instance-1:",
			instanceError,
		);

		// Base template query failure
		vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findFirst,
		).mockResolvedValue(mockRawInstance);
		const templateError = new Error("Base template query failed");
		vi.mocked(mockDrizzleClient.query.eventsTable.findFirst).mockRejectedValue(
			templateError,
		);

		await expect(
			getRecurringEventInstanceById(
				"instance-1",
				"org-1",
				mockDrizzleClient,
				mockLogger,
			),
		).rejects.toThrow("Base template query failed");

		// Exception query failure
		vi.mocked(mockDrizzleClient.query.eventsTable.findFirst).mockResolvedValue(
			mockBaseTemplate,
		);
		const exceptionError = new Error("Exception query failed");
		vi.mocked(
			mockDrizzleClient.query.eventExceptionsTable.findFirst,
		).mockRejectedValue(exceptionError);

		await expect(
			getRecurringEventInstanceById(
				"instance-1",
				"org-1",
				mockDrizzleClient,
				mockLogger,
			),
		).rejects.toThrow("Exception query failed");

		// Resolution failure
		vi.mocked(
			mockDrizzleClient.query.eventExceptionsTable.findFirst,
		).mockResolvedValue(mockException);
		const resolutionError = new Error("Resolution failed");
		mockResolveInstanceWithInheritance.mockImplementation(() => {
			throw resolutionError;
		});

		await expect(
			getRecurringEventInstanceById(
				"instance-1",
				"org-1",
				mockDrizzleClient,
				mockLogger,
			),
		).rejects.toThrow("Resolution failed");
	});
});

describe("getRecurringEventInstancesByIds", () => {
	let mockDrizzleClient: ServiceDependencies["drizzleClient"];
	let mockLogger: ServiceDependencies["logger"];

	beforeEach(() => {
		vi.clearAllMocks();
		mockDrizzleClient = setupMockDrizzleClient();
		mockLogger = setupMockLogger();

		// Default mock implementations
		vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).mockResolvedValue([mockRawInstance]);
		vi.mocked(mockDrizzleClient.query.eventsTable.findMany).mockResolvedValue([
			mockBaseTemplate,
		]);
		vi.mocked(
			mockDrizzleClient.query.eventExceptionsTable.findMany,
		).mockResolvedValue([mockException]);

		mockCreateTemplateLookupMap.mockReturnValue(
			new Map([["base-event-1", mockBaseTemplate]]),
		);
		mockCreateExceptionLookupMap.mockReturnValue(
			new Map([["instance-1", mockException]]),
		);
		mockResolveMultipleInstances.mockReturnValue([mockResolvedInstance]);
	});

	it("should return empty array when instanceIds is empty", async () => {
		const result = await getRecurringEventInstancesByIds(
			[],
			mockDrizzleClient,
			mockLogger,
		);

		expect(result).toEqual([]);
		// Should not make any database calls
		expect(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).not.toHaveBeenCalled();
		expect(mockDrizzleClient.query.eventsTable.findMany).not.toHaveBeenCalled();
		expect(
			mockDrizzleClient.query.eventExceptionsTable.findMany,
		).not.toHaveBeenCalled();
	});

	it("should query with inArray condition and return resolved instances", async () => {
		const instanceIds = ["instance-1", "instance-2", "instance-3"];
		const instances = instanceIds.map((id) => ({ ...mockRawInstance, id }));
		const resolved = instances.map((instance) => ({
			...mockResolvedInstance,
			id: instance.id,
		}));

		vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).mockResolvedValue(instances);
		mockResolveMultipleInstances.mockReturnValue(resolved);

		const result = await getRecurringEventInstancesByIds(
			instanceIds,
			mockDrizzleClient,
			mockLogger,
		);

		expect(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).toHaveBeenCalledWith({
			where: expect.any(Object), // inArray(recurringEventInstancesTable.id, instanceIds)
		});

		expect(result).toHaveLength(3);
		expect(result.map((r) => r.id)).toEqual(instanceIds);
	});

	it("should handle empty database results and skip processing", async () => {
		vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).mockResolvedValue([]);

		const result = await getRecurringEventInstancesByIds(
			["non-existent-1", "non-existent-2"],
			mockDrizzleClient,
			mockLogger,
		);

		expect(result).toEqual([]);
		// Should not proceed to template/exception fetching
		expect(mockDrizzleClient.query.eventsTable.findMany).not.toHaveBeenCalled();
		expect(
			mockDrizzleClient.query.eventExceptionsTable.findMany,
		).not.toHaveBeenCalled();
		expect(mockResolveMultipleInstances).not.toHaveBeenCalled();
	});

	it("should fetch templates and exceptions then resolve instances", async () => {
		const result = await getRecurringEventInstancesByIds(
			["instance-1"],
			mockDrizzleClient,
			mockLogger,
		);

		// Verify template and exception fetching
		expect(mockDrizzleClient.query.eventsTable.findMany).toHaveBeenCalledWith({
			where: expect.any(Object), // inArray condition for base event IDs
		});
		expect(
			mockDrizzleClient.query.eventExceptionsTable.findMany,
		).toHaveBeenCalledWith({
			where: expect.any(Object), // inArray condition for instance IDs
		});

		// Verify resolution
		expect(mockCreateTemplateLookupMap).toHaveBeenCalledWith([
			mockBaseTemplate,
		]);
		expect(mockCreateExceptionLookupMap).toHaveBeenCalledWith([mockException]);
		expect(mockResolveMultipleInstances).toHaveBeenCalledWith(
			[mockRawInstance],
			expect.any(Map),
			expect.any(Map),
			mockLogger,
		);

		expect(result).toHaveLength(1);
		expect(result[0]?.id).toBe("instance-1");
	});

	it("should handle partial matches and error scenarios", async () => {
		// Test partial matches (some IDs not found)
		const requestedIds = ["instance-1", "non-existent", "instance-2"];
		const foundInstances = [
			{ ...mockRawInstance, id: "instance-1" },
			{ ...mockRawInstance, id: "instance-2" },
		];
		const resolvedInstances = foundInstances.map((instance) => ({
			...mockResolvedInstance,
			id: instance.id,
		}));

		vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).mockResolvedValue(foundInstances);
		mockResolveMultipleInstances.mockReturnValue(resolvedInstances);

		const result = await getRecurringEventInstancesByIds(
			requestedIds,
			mockDrizzleClient,
			mockLogger,
		);

		expect(result).toHaveLength(2);
		expect(result.map((r) => r.id)).toEqual(["instance-1", "instance-2"]);

		// Test error handling
		const error = new Error("Database connection failed");
		vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).mockRejectedValue(error);

		await expect(
			getRecurringEventInstancesByIds(
				["instance-1"],
				mockDrizzleClient,
				mockLogger,
			),
		).rejects.toThrow("Database connection failed");

		expect(mockLogger.error).toHaveBeenCalledWith(
			"Failed to get recurring event instances by IDs:",
			error,
		);

		// Test template/exception errors
		vi.mocked(
			mockDrizzleClient.query.recurringEventInstancesTable.findMany,
		).mockResolvedValue([mockRawInstance]);
		const templateError = new Error("Templates query failed");
		vi.mocked(mockDrizzleClient.query.eventsTable.findMany).mockRejectedValue(
			templateError,
		);

		await expect(
			getRecurringEventInstancesByIds(
				["instance-1"],
				mockDrizzleClient,
				mockLogger,
			),
		).rejects.toThrow("Templates query failed");

		// Test resolution error
		vi.mocked(mockDrizzleClient.query.eventsTable.findMany).mockResolvedValue([
			mockBaseTemplate,
		]);
		const resolutionError = new Error("Resolution failed");
		mockResolveMultipleInstances.mockImplementation(() => {
			throw resolutionError;
		});

		await expect(
			getRecurringEventInstancesByIds(
				["instance-1"],
				mockDrizzleClient,
				mockLogger,
			),
		).rejects.toThrow("Resolution failed");
	});
});
