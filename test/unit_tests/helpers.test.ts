import { describe, it, expect, vi, beforeEach } from "vitest";
import fs from "node:fs/promises";
import * as helpers from "../../scripts/dbManagement/helpers";
import readline from "node:readline";

vi.mock("node:fs/promises");

describe("Seeder Helpers - 100% Policy Coverage Suite", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.restoreAllMocks();

		/* ---------------- Drizzle mocks ---------------- */
		const mockChain: any = {
			values: vi.fn().mockReturnThis(),
			onConflictDoNothing: vi.fn().mockResolvedValue([]),
			onConflictDoUpdate: vi.fn().mockResolvedValue([]),
			from: vi.fn().mockResolvedValue([{ count: 0 }]),
			where: vi.fn().mockReturnThis(),
		};

		vi.spyOn(helpers.db, "insert").mockReturnValue(mockChain);
		vi.spyOn(helpers.db, "select").mockReturnValue(mockChain);
		vi.spyOn(helpers.db, "execute").mockResolvedValue([{ tablename: "test" }] as any);

		vi.spyOn(helpers.db.query.usersTable, "findFirst").mockResolvedValue(
			{ id: "admin-id" } as any,
		);

		vi.spyOn(helpers.db, "transaction").mockImplementation(async (cb) =>
			cb(helpers.db as any),
		);

		vi.stubEnv("API_ADMINISTRATOR_USER_EMAIL_ADDRESS", "admin@test.com");
	});

	/* ---------------- Utilities ---------------- */
	it("covers constants and date utilities", () => {
		expect(helpers.MS_PER_DAY).toBe(86400000);

		expect(helpers.parseDate("2026-01-01")).toBeInstanceOf(Date);
		expect(helpers.parseDate(Date.now())).toBeInstanceOf(Date);
		expect(helpers.parseDate(new Date())).toBeInstanceOf(Date);

		expect(helpers.parseDate(null)).toBeNull();
		expect(helpers.parseDate(undefined)).toBeNull();
		expect(helpers.parseDate([])).toBeNull();
		expect(helpers.parseDate({})).toBeNull();
		expect(helpers.parseDate("invalid")).toBeNull();

		expect(
			helpers.toICalendarUntil(new Date("2026-01-01T00:00:00Z")),
		).toBe("20260101T000000Z");
	});

	/* ---------------- Infrastructure ---------------- */
	it("covers pingDB, formatDatabase, validateSampleData", async () => {
		await helpers.pingDB();
		vi.spyOn(helpers.db, "execute").mockRejectedValueOnce(new Error());
		await helpers.pingDB();

		await helpers.formatDatabase();
		vi.stubEnv("API_ADMINISTRATOR_USER_EMAIL_ADDRESS", "");
		await helpers.formatDatabase();

		vi.spyOn(fs, "readdir").mockResolvedValue(["x.json"] as any);
		vi.spyOn(fs, "readFile").mockResolvedValue("[]");
		await helpers.validateSampleData();

		vi.spyOn(fs, "readdir").mockRejectedValueOnce(new Error());
		await helpers.validateSampleData();
	});

	/* ---------------- askUserToContinue (REAL PATH) ---------------- */
	it("covers askUserToContinue readline path", async () => {
		const questionSpy = vi.fn((_q: string, cb: (a: string) => void) => cb("y"));
		const closeSpy = vi.fn();

		vi.spyOn(readline, "createInterface").mockReturnValue({
			question: questionSpy,
			close: closeSpy,
		} as any);

		const result = await helpers.askUserToContinue("Continue?");
		expect(result).toBe(true);
		expect(questionSpy).toHaveBeenCalled();
		expect(closeSpy).toHaveBeenCalled();
	});

	/* ---------------- emptyMinioBucket SUCCESS + FAIL ---------------- */
	it("covers emptyMinioBucket success and failure paths", async () => {
		// success path (async iterator)
		vi.spyOn(helpers.minioClient, "listObjects").mockReturnValue(
			(async function* () {
				yield { name: "file1" };
				yield { name: "file2" };
			})() as any,
		);
		vi.spyOn(helpers.minioClient, "removeObjects").mockResolvedValue(undefined as any);

		await helpers.emptyMinioBucket();

		// failure path
		vi.spyOn(helpers.minioClient, "listObjects").mockImplementation(() => {
			throw new Error("minio");
		});
		await helpers.emptyMinioBucket();
	});

	/* ---------------- insertCollections ---------------- */
	it("covers insertCollections handlers and catch", async () => {
		const payload = JSON.stringify([
			{
				id: "1",
				emailAddress: "a@b.com",
				organizationId: "1",
				eventId: "1",
				userId: "1",
				frequency: "DAILY",
				interval: 1,
			},
		]);

		vi.spyOn(fs, "readFile").mockResolvedValue(payload);

		await helpers.insertCollections(
			["users", "organizations", "events", "recurrence_rules", "event_attendees"],
			true,
		);

		await helpers.insertCollections(["unknown"], false);

		vi.spyOn(fs, "readFile").mockRejectedValueOnce(new Error());
		await helpers.insertCollections(["users"]);
	});

	/* ---------------- Recurrence logic ---------------- */
	it("covers all insertRecurrenceRules branches", async () => {
		await helpers.insertRecurrenceRules([]);

		await helpers.insertRecurrenceRules([
			{
				id: "1",
				baseRecurringEventId: "e1",
				creatorId: "u1",
				organizationId: "o1",
				frequency: "WEEKLY",
				interval: 1,
				byDay: "+1MO",
			} as any,
		]);

		await expect(
			helpers.insertRecurrenceRules([{ frequency: "HOURLY" } as any]),
		).rejects.toThrow();

		await expect(
			helpers.insertRecurrenceRules([
				{ frequency: "DAILY", interval: 0 } as any,
			]),
		).rejects.toThrow();

		await expect(
			helpers.insertRecurrenceRules([
				{ frequency: "DAILY", interval: 1, byDay: "XX" } as any,
			]),
		).rejects.toThrow();
	});

	/* ---------------- Reporting & cleanup ---------------- */
	it("covers checkDataSize and disconnect", async () => {
		await helpers.checkDataSize("stage");

		vi.spyOn(helpers.queryClient, "end").mockResolvedValue(undefined as any);
		await helpers.disconnect();

		vi.spyOn(helpers.queryClient, "end").mockRejectedValueOnce(new Error());
		await helpers.disconnect();
	});
});
