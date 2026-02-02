import fs from "node:fs/promises";
import readline from "node:readline";
import { eq } from "drizzle-orm";
import * as schema from "src/drizzle/schema";
import type { TestEnvConfig } from "test/envConfigSchema";
import { uuidv7 } from "uuidv7";
import {
	afterAll,
	afterEach,
	beforeAll,
	expect,
	suite,
	test,
	vi,
} from "vitest";

vi.mock("src/services/eventGeneration/windowManager", () => ({
	initializeGenerationWindow: vi.fn().mockResolvedValue({}),
}));

let testEnvConfig: TestEnvConfig;
let helpers: typeof import("scripts/dbManagement/helpers");

beforeAll(async () => {
	const module = await import("test/envConfigSchema");
	testEnvConfig = module.testEnvConfig;
	vi.doMock("env-schema", async (importOriginal) => {
		const actual = (await importOriginal()) as typeof import("env-schema");
		return {
			...actual,
			default: vi.fn((opts) => {
				const realEnv = actual.default(opts);
				return {
					...realEnv,
					API_POSTGRES_HOST: testEnvConfig.API_POSTGRES_TEST_HOST,
					API_MINIO_END_POINT: testEnvConfig.API_MINIO_TEST_END_POINT,
					MINIO_ROOT_USER: testEnvConfig.MINIO_ROOT_USER,
				};
			}),
		};
	});
	vi.resetModules();
	helpers = await import("scripts/dbManagement/helpers");
});

afterEach(async () => {
	// Clean up recurring event template rows to avoid DB state pollution across tests/shards
	if (helpers?.db && schema.eventsTable) {
		await helpers.db
			.delete(schema.eventsTable)
			.where(eq(schema.eventsTable.isRecurringEventTemplate, true));
	}
});

afterAll(async () => {
	vi.resetModules();
	vi.unmock("env-schema");
});

suite.concurrent("parseDate", () => {
	test.concurrent("should return a valid Date object for a valid date string", async () => {
		const input = "2021-12-31";
		const result = helpers.parseDate(input);
		expect(result).not.toBeNull();
		if (result !== null) {
			// Compare ISO strings to avoid timezone issues
			expect(result.toISOString()).toBe(new Date(input).toISOString());
		}
	});

	test.concurrent("should return valid Date objects for a valid number timestamp and Date object", async () => {
		// Test using a numeric timestamp
		const timestamp = 1609459200000; // Jan 1, 2021 00:00:00 GMT
		const resultFromNumber = helpers.parseDate(timestamp);
		expect(resultFromNumber).not.toBeNull();
		if (resultFromNumber !== null) {
			expect(resultFromNumber.getTime()).toBe(timestamp);
		}

		// Test using an already existing Date object
		const dateObj = new Date("2021-12-31T00:00:00Z");
		const resultFromDate = helpers.parseDate(dateObj);
		expect(resultFromDate).not.toBeNull();
		if (resultFromDate !== null) {
			expect(resultFromDate.toISOString()).toBe(dateObj.toISOString());
		}
	});

	test.concurrent("should return null for invalid date inputs", async () => {
		// Test an invalid date string
		expect(helpers.parseDate("invalid-date")).toBeNull();
		// Test an invalid number (NaN)
		expect(helpers.parseDate(Number.NaN)).toBeNull();
	});
});

suite.concurrent("getNextOccurrenceOfWeekdayTime", () => {
	test.concurrent("returns next occurrence of same weekday and time on or after reference", async () => {
		// Template: Tuesday 2025-04-01 09:00 UTC
		const templateStart = new Date("2025-04-01T09:00:00.000Z");
		// Reference: Monday 2025-03-31 00:00 UTC → next Tuesday = 2025-04-01 09:00
		const ref = new Date("2025-03-31T00:00:00.000Z");
		const result = helpers.getNextOccurrenceOfWeekdayTime(ref, templateStart);
		expect(result.toISOString()).toBe("2025-04-01T09:00:00.000Z");
	});

	test.concurrent("returns same week occurrence when reference is before that weekday time", async () => {
		// Template: Wednesday 14:00 UTC
		const templateStart = new Date("2025-04-02T14:00:00.000Z");
		// Reference: Monday 2025-03-31 00:00 → next Wed = 2025-04-02 14:00
		const ref = new Date("2025-03-31T00:00:00.000Z");
		const result = helpers.getNextOccurrenceOfWeekdayTime(ref, templateStart);
		expect(result.toISOString()).toBe("2025-04-02T14:00:00.000Z");
	});

	test.concurrent("returns next week when reference is past that weekday time", async () => {
		// Template: Tuesday 09:00 UTC
		const templateStart = new Date("2025-04-01T09:00:00.000Z");
		// Reference: Tuesday 2025-04-01 10:00 (past 09:00) → next Tuesday = 2025-04-08 09:00
		const ref = new Date("2025-04-01T10:00:00.000Z");
		const result = helpers.getNextOccurrenceOfWeekdayTime(ref, templateStart);
		expect(result.toISOString()).toBe("2025-04-08T09:00:00.000Z");
	});

	test.concurrent("same weekday exact same time returns that same date (no week shift)", async () => {
		const same = new Date("2025-04-01T09:00:00.000Z");
		const result = helpers.getNextOccurrenceOfWeekdayTime(same, same);
		expect(result.getTime()).toBe(same.getTime());
		expect(result.toISOString()).toBe("2025-04-01T09:00:00.000Z");
	});

	test.concurrent("Sunday handling: next occurrence around references before and after that Sunday", async () => {
		// Template: Sunday 2025-04-06 12:00 UTC (weekday 0)
		const templateStart = new Date("2025-04-06T12:00:00.000Z");
		// Reference: Saturday 2025-04-05 00:00 → next Sunday = 2025-04-06 12:00
		const refBefore = new Date("2025-04-05T00:00:00.000Z");
		const resultBefore = helpers.getNextOccurrenceOfWeekdayTime(
			refBefore,
			templateStart,
		);
		expect(resultBefore.toISOString()).toBe("2025-04-06T12:00:00.000Z");
		// Reference: Monday 2025-04-07 00:00 → next Sunday = 2025-04-13 12:00
		const refAfter = new Date("2025-04-07T00:00:00.000Z");
		const resultAfter = helpers.getNextOccurrenceOfWeekdayTime(
			refAfter,
			templateStart,
		);
		expect(resultAfter.toISOString()).toBe("2025-04-13T12:00:00.000Z");
	});

	test.concurrent("milliseconds preservation in returned date", async () => {
		const templateStart = new Date("2025-04-01T09:00:00.123Z");
		const ref = new Date("2025-03-31T00:00:00.000Z");
		const result = helpers.getNextOccurrenceOfWeekdayTime(ref, templateStart);
		expect(result.getUTCMilliseconds()).toBe(123);
		expect(result.toISOString()).toBe("2025-04-01T09:00:00.123Z");
	});
});

suite.concurrent("action item ID generation", () => {
	test.concurrent("should generate new uuidv7 when ID is not 36 characters", async () => {
		const actionItem = {
			id: "short-id",
			assignedAt: "2024-03-14",
			completionAt: "2024-03-15",
			createdAt: "2024-03-13",
			updaterId: "user-123",
		};

		const result = {
			...actionItem,
			id: actionItem.id.length === 36 ? actionItem.id : uuidv7(),
			assignedAt: helpers.parseDate(actionItem.assignedAt),
			completionAt: helpers.parseDate(actionItem.completionAt),
			createdAt: helpers.parseDate(actionItem.createdAt),
		};

		expect(result.id).not.toBe("short-id");
		expect(result.id.length).toBe(36);
	});
});

suite.concurrent("askUserToContinue", () => {
	test.concurrent("should resolve to true when user inputs 'y'", async () => {
		const fakeInterface = {
			question: (_query: string, callback: (answer: string) => void) => {
				callback("y");
			},
			close: vi.fn(),
		};

		vi.spyOn(readline, "createInterface").mockReturnValue(
			fakeInterface as unknown as readline.Interface,
		);

		const result = await helpers.askUserToContinue("Continue?");
		expect(result).toBe(true);
		expect(fakeInterface.close).toHaveBeenCalled();
	});

	test.concurrent("should resolve to false when user inputs 'n'", async () => {
		const fakeInterface = {
			question: (_query: string, callback: (answer: string) => void) => {
				callback("n");
			},
			close: vi.fn(),
		};

		vi.spyOn(readline, "createInterface").mockReturnValue(
			fakeInterface as unknown as readline.Interface,
		);

		const result = await helpers.askUserToContinue("Continue?");
		expect(result).toBe(false);
		expect(fakeInterface.close).toHaveBeenCalled();
	});

	test.concurrent("should trim and ignore case in the input", async () => {
		const fakeInterface = {
			question: (_query: string, callback: (answer: string) => void) => {
				callback("  Y  ");
			},
			close: vi.fn(),
		};

		vi.spyOn(readline, "createInterface").mockReturnValue(
			fakeInterface as unknown as readline.Interface,
		);

		const result = await helpers.askUserToContinue("Continue?");
		expect(result).toBe(true);
		expect(fakeInterface.close).toHaveBeenCalled();
	});
});

const overrideDbExecute = (newExecute: () => Promise<unknown>): void => {
	Reflect.set(helpers.db, "execute", newExecute);
};

suite.concurrent("pingDB", () => {
	test.concurrent("should return true when db.execute resolves", async () => {
		const originalExecute = Reflect.get(helpers.db, "execute");
		try {
			overrideDbExecute(() => Promise.resolve());
			const result = await helpers.pingDB();
			expect(result).toBe(true);
		} finally {
			Reflect.set(helpers.db, "execute", originalExecute);
		}
	});

	test.concurrent("should throw error when db.execute rejects", async () => {
		const originalExecute = Reflect.get(helpers.db, "execute");
		try {
			overrideDbExecute(() => Promise.reject(new Error("connection failed")));
			await expect(helpers.pingDB()).rejects.toThrow(
				"Unable to connect to the database.",
			);
		} finally {
			Reflect.set(helpers.db, "execute", originalExecute);
		}
	});
});

suite.concurrent("emptyMinioBucket", () => {
	test.concurrent("should empty the Minio bucket and return true", async () => {
		const result = await helpers.emptyMinioBucket();
		expect(result).toBe(true);
	});
	test.concurrent("should return false if listing objects fails", async () => {
		const minioClient = Reflect.get(helpers, "minioClient");
		const originalListObjects = minioClient.listObjects;
		try {
			minioClient.listObjects = () => {
				const { Readable } = require("node:stream");
				const stream = new Readable({ read() {} });
				process.nextTick(() => {
					stream.emit("error", new Error("Failed to list objects"));
					stream.push(null);
				});
				return stream;
			};

			const result = await helpers.emptyMinioBucket();
			expect(result).toBe(false);
		} finally {
			minioClient.listObjects = originalListObjects;
		}
	});
});

suite.concurrent("checkAndInsertData", () => {
	test.concurrent("should return false when given no rows", async () => {
		const result = await helpers.checkAndInsertData(
			schema.usersTable,
			[],
			schema.usersTable.id,
			1000,
		);
		expect(result).toBe(false);
	});

	test.concurrent("should throw error if transaction fails", async () => {
		const db = Reflect.get(helpers, "db");
		const originalTransaction = db.transaction;
		try {
			db.transaction = async () => {
				throw new Error("Transaction failed");
			};

			await expect(
				helpers.checkAndInsertData(
					schema.usersTable,
					[{ id: 1 }],
					schema.usersTable.id,
					1000,
				),
			).rejects.toThrow("Transaction failed");
		} finally {
			db.transaction = originalTransaction;
		}
	});
});

suite.concurrent("insertCollections", () => {
	test.concurrent("should insert collection data (for a valid collection) and return true", async () => {
		const result = await helpers.insertCollections([
			"users",
			"organizations",
			"organization_memberships",
			"posts",
			"post_votes",
			"post_attachments",
			"comments",
			"comment_votes",
			"action_categories",
			"events",
			"recurring_event_templates",
			"action_items",
			"membership_requests",
		]);
		expect(result).toBe(true);
	});

	test.concurrent("should throw error for an invalid collection name", async () => {
		await expect(
			helpers.insertCollections(["invalid_collection"]),
		).rejects.toThrow(/Error adding data to tables:/);
	});

	test.concurrent("should transform recurring_event_templates with parseDate/getNextOccurrenceOfWeekdayTime and set isPublic and isRecurringEventTemplate", async () => {
		const fixedTime = new Date("2025-02-01T12:00:00.000Z");
		vi.useFakeTimers();
		vi.setSystemTime(fixedTime);
		try {
			const checkAndInsertDataSpy = vi.spyOn(helpers, "checkAndInsertData");
			await helpers.insertCollections([
				"users",
				"organizations",
				"organization_memberships",
				"posts",
				"post_votes",
				"post_attachments",
				"comments",
				"comment_votes",
				"action_categories",
				"events",
				"recurring_event_templates",
				"action_items",
				"membership_requests",
			]);
			const eventsTableCalls = checkAndInsertDataSpy.mock.calls.filter(
				(call) => call[0] === schema.eventsTable,
			);
			expect(eventsTableCalls.length).toBeGreaterThanOrEqual(2);
			const lastEventsCall = eventsTableCalls[eventsTableCalls.length - 1];
			const templateRows = lastEventsCall?.[1];
			expect(templateRows).toBeDefined();
			expect(Array.isArray(templateRows)).toBe(true);
			const rows = templateRows as (typeof schema.eventsTable.$inferInsert)[];
			expect(rows.length).toBeGreaterThan(0);
			const oneWeekAgo = fixedTime.getTime() - 7 * 24 * 60 * 60 * 1000;
			for (const row of rows) {
				expect(row.createdAt).toBeInstanceOf(Date);
				expect(row.startAt).toBeInstanceOf(Date);
				expect(row.endAt).toBeInstanceOf(Date);
				expect(row.updatedAt).toBeNull();
				expect(row.updaterId).toBeNull();
				expect(row.isPublic).toBe(true);
				expect(row.isRecurringEventTemplate).toBe(true);
				expect((row.startAt as Date).getTime()).toBeLessThanOrEqual(
					(row.endAt as Date).getTime(),
				);
				expect((row.startAt as Date).getTime()).toBeGreaterThanOrEqual(
					oneWeekAgo,
				);
			}
			checkAndInsertDataSpy.mockRestore();
		} finally {
			vi.useRealTimers();
		}
	});

	test.concurrent("recurring_event_templates uses fallback start and end when startAt and endAt are invalid (startRef/endRef null)", async () => {
		const fallbackTemplate = {
			id: "01960b97-00c0-7e00-8000-0000000000ff",
			name: "Fallback Template",
			organizationId: "01960b81-bfed-7369-ae96-689dbd4281ba",
			creatorId: "67378abd-8500-4f17-9cf2-990d00000005",
			description: "Template with invalid dates",
			startAt: "invalid-date",
			endAt: "not-a-date",
			allDay: true,
			createdAt: "2025-03-30T01:00:00.000Z",
		};
		const readFileSpy = vi
			.spyOn(fs, "readFile")
			.mockResolvedValue(JSON.stringify([fallbackTemplate]));
		const checkAndInsertDataSpy = vi.spyOn(helpers, "checkAndInsertData");
		await helpers.insertCollections(["recurring_event_templates"]);
		const eventsTableCalls = checkAndInsertDataSpy.mock.calls.filter(
			(call) => call[0] === schema.eventsTable,
		);
		expect(eventsTableCalls.length).toBe(1);
		const rows =
			eventsTableCalls[0]?.[1] as (typeof schema.eventsTable.$inferInsert)[];
		expect(rows).toBeDefined();
		expect(rows.length).toBe(1);
		const row = rows[0];
		expect(row?.startAt).toBeInstanceOf(Date);
		expect(row?.endAt).toBeInstanceOf(Date);
		expect(
			(row?.endAt as Date).getTime() - (row?.startAt as Date).getTime(),
		).toBe(2 * 60 * 60 * 1000);
		expect(row?.isPublic).toBe(true);
		expect(row?.isRecurringEventTemplate).toBe(true);
		expect(row?.updatedAt).toBeNull();
		expect(row?.updaterId).toBeNull();
		readFileSpy.mockRestore();
		checkAndInsertDataSpy.mockRestore();
	});

	test.concurrent("recurring_event_templates uses fallback end when endAt is invalid (endRef null)", async () => {
		const templateValidStart = {
			id: "01960b97-00c0-7e00-8000-0000000000fe",
			name: "Fallback End Template",
			organizationId: "01960b81-bfed-7369-ae96-689dbd4281ba",
			creatorId: "67378abd-8500-4f17-9cf2-990d00000005",
			description: "Template with invalid endAt",
			startAt: "2025-04-01T09:00:00.000Z",
			endAt: null,
			allDay: true,
			createdAt: "2025-03-30T01:00:00.000Z",
		};
		const readFileSpy = vi
			.spyOn(fs, "readFile")
			.mockResolvedValue(JSON.stringify([templateValidStart]));
		const checkAndInsertDataSpy = vi.spyOn(helpers, "checkAndInsertData");
		await helpers.insertCollections(["recurring_event_templates"]);
		const eventsTableCalls = checkAndInsertDataSpy.mock.calls.filter(
			(call) => call[0] === schema.eventsTable,
		);
		expect(eventsTableCalls.length).toBe(1);
		const rows =
			eventsTableCalls[0]?.[1] as (typeof schema.eventsTable.$inferInsert)[];
		expect(rows).toBeDefined();
		expect(rows.length).toBe(1);
		const row = rows[0];
		expect(row?.startAt).toBeInstanceOf(Date);
		expect(row?.endAt).toBeInstanceOf(Date);
		expect(
			(row?.endAt as Date).getTime() - (row?.startAt as Date).getTime(),
		).toBe(2 * 60 * 60 * 1000);
		expect(row?.isPublic).toBe(true);
		expect(row?.isRecurringEventTemplate).toBe(true);
		readFileSpy.mockRestore();
		checkAndInsertDataSpy.mockRestore();
	});

	test.concurrent("recurring_event_templates uses fallback start when startAt is invalid (startRef null)", async () => {
		const fixedTime = new Date("2025-02-01T12:00:00.000Z");
		vi.useFakeTimers();
		vi.setSystemTime(fixedTime);
		try {
			const templateValidEnd = {
				id: "01960b97-00c0-7e00-8000-0000000000fd",
				name: "Fallback Start Template",
				organizationId: "01960b81-bfed-7369-ae96-689dbd4281ba",
				creatorId: "67378abd-8500-4f17-9cf2-990d00000005",
				description: "Template with invalid startAt",
				startAt: null,
				endAt: "2025-04-01T11:00:00.000Z",
				allDay: true,
				createdAt: "2025-03-30T01:00:00.000Z",
			};
			const readFileSpy = vi
				.spyOn(fs, "readFile")
				.mockResolvedValue(JSON.stringify([templateValidEnd]));
			const checkAndInsertDataSpy = vi.spyOn(helpers, "checkAndInsertData");
			await helpers.insertCollections(["recurring_event_templates"]);
			const eventsTableCalls = checkAndInsertDataSpy.mock.calls.filter(
				(call) => call[0] === schema.eventsTable,
			);
			expect(eventsTableCalls.length).toBe(1);
			const rows =
				eventsTableCalls[0]?.[1] as (typeof schema.eventsTable.$inferInsert)[];
			expect(rows).toBeDefined();
			expect(rows.length).toBe(1);
			const row = rows[0];
			expect(row?.startAt).toBeInstanceOf(Date);
			expect((row?.startAt as Date).getTime()).toBe(fixedTime.getTime());
			expect(row?.endAt).toBeInstanceOf(Date);
			expect(row?.isPublic).toBe(true);
			expect(row?.isRecurringEventTemplate).toBe(true);
			readFileSpy.mockRestore();
			checkAndInsertDataSpy.mockRestore();
		} finally {
			vi.useRealTimers();
		}
	});

	test.concurrent("recurring_event_templates survive multiple seeding cycles (idempotent)", async () => {
		const fixedTime = new Date("2025-02-01T12:00:00.000Z");
		vi.useFakeTimers();
		vi.setSystemTime(fixedTime);
		try {
			const collections = [
				"users",
				"organizations",
				"organization_memberships",
				"posts",
				"post_votes",
				"post_attachments",
				"comments",
				"comment_votes",
				"action_categories",
				"events",
				"recurring_event_templates",
				"action_items",
				"membership_requests",
			] as const;
			const first = await helpers.insertCollections([...collections]);
			expect(first).toBe(true);
			const afterFirst = await helpers.db
				.select()
				.from(schema.eventsTable)
				.where(eq(schema.eventsTable.isRecurringEventTemplate, true));
			expect(afterFirst.length).toBeGreaterThan(0);
			const second = await helpers.insertCollections([...collections]);
			expect(second).toBe(true);
			const afterSecond = await helpers.db
				.select()
				.from(schema.eventsTable)
				.where(eq(schema.eventsTable.isRecurringEventTemplate, true));
			expect(afterSecond.length).toBe(afterFirst.length);
			for (const row of afterSecond) {
				expect(row.isPublic).toBe(true);
				expect(row.isRecurringEventTemplate).toBe(true);
			}
		} finally {
			vi.useRealTimers();
		}
	});

	test.concurrent("should generate new uuidv7 for action items with short IDs", async () => {
		const userId = uuidv7();
		await helpers.checkAndInsertData(
			schema.usersTable,
			[
				{
					id: userId,
					emailAddress: "test@example.com",
					name: "Test User",
					passwordHash: "hashed_password_123",
					isEmailAddressVerified: true,
					role: "regular",
					createdAt: new Date(),
					updatedAt: new Date(),
				},
			],
			schema.usersTable.id,
			1000,
		);

		const organizationId = "123e4567-e89b-12d3-a456-426614174000";
		await helpers.checkAndInsertData(
			schema.organizationsTable,
			[
				{
					id: organizationId,
					name: "Test Organizations",
					description: "Test organization description",
					createdAt: new Date(),
					updatedAt: new Date(),
					creatorId: userId,
					updaterId: userId,
					isUserRegistrationRequired: false,
				},
			],
			schema.organizationsTable.id,
			1000,
		);

		const categoryId = "123e4567-e89b-12d3-a456-426614174001";
		await helpers.checkAndInsertData(
			schema.actionItemCategoriesTable,
			[
				{
					id: categoryId,
					name: "Test Category",
					description: "Test category description",
					createdAt: new Date(),
					updatedAt: new Date(),
					creatorId: userId,
					updaterId: userId,
					organizationId: organizationId,
					isDisabled: false,
				},
			],
			schema.actionItemCategoriesTable.id,
			1000,
		);
		const mockActionItem = {
			id: "short-id",
			assignedAt: "2024-03-14",
			completionAt: "2024-03-15",
			createdAt: "2024-03-13",
			updatedAt: "2024-03-13",
			preCompletionNotes: "Test notes",
			postCompletionNotes: "",
			organizationId: organizationId,
			categoryId: categoryId,
			eventId: null,
			assigneeId: userId,
			creatorId: userId,
			updaterId: userId,
			isCompleted: false,
		};

		let capturedData: (typeof schema.actionItemsTable.$inferInsert)[] = [];
		const checkAndInsertDataSpy = vi
			.spyOn(helpers, "checkAndInsertData")
			.mockImplementation((_table, data) => {
				capturedData = data as (typeof schema.actionItemsTable.$inferInsert)[];
				return Promise.resolve(true);
			});

		const actionItemWithUuid = {
			...mockActionItem,
			id: uuidv7(),
			assignedAt: helpers.parseDate(mockActionItem.assignedAt),
			completionAt: helpers.parseDate(mockActionItem.completionAt),
			createdAt: helpers.parseDate(mockActionItem.createdAt),
			updatedAt: helpers.parseDate(mockActionItem.updatedAt),
		};

		await helpers.checkAndInsertData(
			schema.actionItemsTable,
			[actionItemWithUuid],
			schema.actionItemsTable.id,
			1000,
		);

		expect(capturedData.length).toBeGreaterThan(0);
		const firstItem = capturedData[0];
		if (!firstItem || !firstItem.id) {
			throw new Error("Expected action item with ID");
		}
		expect(firstItem.id).not.toBe("short-id");
		expect(firstItem.id.length).toBe(36);

		checkAndInsertDataSpy.mockRestore();
	});
});

suite("events isRecurringEventTemplate", () => {
	test("should set isRecurringEventTemplate true when event has isRecurringEventTemplate in JSON", async () => {
		let capturedEvents: { isRecurringEventTemplate?: boolean }[] = [];
		const checkAndInsertDataSpy = vi
			.spyOn(helpers, "checkAndInsertData")
			.mockImplementation(async (table, rows) => {
				if (table === schema.eventsTable) {
					capturedEvents = rows as { isRecurringEventTemplate?: boolean }[];
				}
				return true;
			});

		await helpers.insertCollections(["events"]);

		expect(capturedEvents.length).toBeGreaterThan(0);
		const withTemplate = capturedEvents.some(
			(e) => e.isRecurringEventTemplate === true,
		);
		expect(withTemplate).toBe(true);
		checkAndInsertDataSpy.mockRestore();
	});
});

suite("recurrence_rules ingestion", () => {
	test("should parse recurrence_rules with null recurrenceEndDate and updatedAt", async () => {
		let capturedRules: {
			recurrenceEndDate: Date | null;
			updatedAt: Date | null;
			recurrenceStartDate: Date | null;
			latestInstanceDate: Date | null;
			createdAt: Date | null;
		}[] = [];
		const checkAndInsertDataSpy = vi
			.spyOn(helpers, "checkAndInsertData")
			.mockImplementation(async (table, rows) => {
				if (table === schema.recurrenceRulesTable) {
					capturedRules = rows as typeof capturedRules;
				}
				return true;
			});

		await helpers.insertCollections(["recurrence_rules"]);

		expect(capturedRules.length).toBeGreaterThan(0);
		for (const rule of capturedRules) {
			expect(rule.recurrenceEndDate).toBeNull();
			expect(rule.updatedAt).toBeNull();
			expect(rule.recurrenceStartDate).toBeInstanceOf(Date);
			expect(rule.latestInstanceDate).toBeInstanceOf(Date);
			expect(rule.createdAt).toBeInstanceOf(Date);
		}
		checkAndInsertDataSpy.mockRestore();
	});

	test("should use idempotent insert for recurrence_rules (conflict target id)", async () => {
		let conflictTarget: unknown = null;
		const checkAndInsertDataSpy = vi
			.spyOn(helpers, "checkAndInsertData")
			.mockImplementation(async (_table, _rows, target) => {
				conflictTarget = target;
				return true;
			});

		await helpers.insertCollections(["recurrence_rules"]);

		expect(conflictTarget).toBe(schema.recurrenceRulesTable.id);
		checkAndInsertDataSpy.mockRestore();
	});
});

suite("initializeGenerationWindow in recurrence_rules flow", () => {
	test("should call initializeGenerationWindow when no window exists for org", async () => {
		const windowManager = await import(
			"src/services/eventGeneration/windowManager"
		);
		vi.mocked(windowManager.initializeGenerationWindow).mockClear();

		const checkAndInsertDataSpy = vi
			.spyOn(helpers, "checkAndInsertData")
			.mockResolvedValue(true);

		const db = Reflect.get(helpers, "db");
		const originalFindFirst = db.query.eventGenerationWindowsTable.findFirst;
		db.query.eventGenerationWindowsTable.findFirst = vi
			.fn()
			.mockResolvedValue(null);

		await helpers.insertCollections(["recurrence_rules"]);

		expect(windowManager.initializeGenerationWindow).toHaveBeenCalled();
		db.query.eventGenerationWindowsTable.findFirst = originalFindFirst;
		checkAndInsertDataSpy.mockRestore();
	});

	test("should not call initializeGenerationWindow when window already exists", async () => {
		const windowManager = await import(
			"src/services/eventGeneration/windowManager"
		);
		vi.mocked(windowManager.initializeGenerationWindow).mockClear();

		const checkAndInsertDataSpy = vi
			.spyOn(helpers, "checkAndInsertData")
			.mockResolvedValue(true);

		const db = Reflect.get(helpers, "db");
		const originalFindFirst = db.query.eventGenerationWindowsTable.findFirst;
		db.query.eventGenerationWindowsTable.findFirst = vi
			.fn()
			.mockResolvedValue({ id: "existing-window-id" });

		await helpers.insertCollections(["recurrence_rules"]);

		expect(windowManager.initializeGenerationWindow).not.toHaveBeenCalled();
		db.query.eventGenerationWindowsTable.findFirst = originalFindFirst;
		checkAndInsertDataSpy.mockRestore();
	});

	test("when initializeGenerationWindow throws for one org, logs warn and continues for others", async () => {
		const windowManager = await import(
			"src/services/eventGeneration/windowManager"
		);
		// recurrence_rules.json has 3 rules with 3 distinct organizationIds → orgToCreatorId has 3 entries
		const failOrgId = "01960b81-bfed-7369-ae96-689dbd4281ba";
		const thrownError = new Error("FK violation");
		vi.mocked(windowManager.initializeGenerationWindow).mockImplementation(
			async (input) => {
				if (input.organizationId === failOrgId) throw thrownError;
				return {} as Awaited<
					ReturnType<typeof windowManager.initializeGenerationWindow>
				>;
			},
		);

		const infoSpy = vi.spyOn(helpers.SampleDataLoggerAdapter.prototype, "info");

		const checkAndInsertDataSpy = vi
			.spyOn(helpers, "checkAndInsertData")
			.mockResolvedValue(true);

		const db = Reflect.get(helpers, "db");
		const originalFindFirst = db.query.eventGenerationWindowsTable.findFirst;
		db.query.eventGenerationWindowsTable.findFirst = vi
			.fn()
			.mockResolvedValue(null);

		await helpers.insertCollections(["recurrence_rules"]);

		expect(infoSpy).toHaveBeenCalledTimes(1);
		expect(infoSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				error: thrownError,
				organizationId: failOrgId,
				createdById: "67378abd-8500-4f17-9cf2-990d00000005",
			}),
			"Failed to initialize generation window for organization",
		);
		expect(windowManager.initializeGenerationWindow).toHaveBeenCalledTimes(3);

		infoSpy.mockRestore();
		db.query.eventGenerationWindowsTable.findFirst = originalFindFirst;
		checkAndInsertDataSpy.mockRestore();
		vi.mocked(windowManager.initializeGenerationWindow).mockResolvedValue(
			{} as Awaited<
				ReturnType<typeof windowManager.initializeGenerationWindow>
			>,
		);
	});
});

suite(
	"checkDataSize includes recurrence_rules and event_generation_windows",
	() => {
		test("should query recurrence_rules and event_generation_windows tables", async () => {
			const tablesQueried: unknown[] = [];
			const db = Reflect.get(helpers, "db");
			const originalSelect = db.select;
			db.select = vi.fn().mockReturnValue({
				from: vi.fn((table: unknown) => {
					tablesQueried.push(table);
					return Promise.resolve([{ count: 0 }]);
				}),
			});

			await helpers.checkDataSize("Test Stage");

			expect(tablesQueried).toContain(schema.recurrenceRulesTable);
			expect(tablesQueried).toContain(schema.eventGenerationWindowsTable);
			db.select = originalSelect;
		});
	},
);

suite.concurrent("checkDataSize integration test", () => {
	test.concurrent("should return a boolean indicating record existence", async () => {
		const result = await helpers.checkDataSize("Test Stage");
		expect(typeof result).toBe("boolean");
	});
	test.concurrent("should return false if db query fails", async () => {
		const db = Reflect.get(helpers, "db");
		const originalSelect = db.select;
		db.select = () => {
			throw new Error("Query failed");
		};

		const result = await helpers.checkDataSize("Test Stage");
		expect(result).toBe(false);
		db.select = originalSelect;
	});
});

suite("disconnect integration test", () => {
	test("should return true when queryClient.end resolves", async () => {
		const queryClient = Reflect.get(helpers, "queryClient");
		const originalEnd = queryClient.end;

		queryClient.end = async () => Promise.resolve();

		const result = await helpers.disconnect();
		expect(result).toBe(true);

		queryClient.end = originalEnd;
	});

	test("should throw error when queryClient.end rejects", async () => {
		const queryClient = Reflect.get(helpers, "queryClient");
		const originalEnd = queryClient.end;

		queryClient.end = async () =>
			Promise.reject(new Error("disconnect failed"));

		await expect(helpers.disconnect()).rejects.toThrow(
			/Error disconnecting from the database:/,
		);

		queryClient.end = originalEnd;
	});
});
