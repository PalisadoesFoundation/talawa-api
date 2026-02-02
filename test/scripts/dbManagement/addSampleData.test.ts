import * as mainModule from "scripts/dbManagement/addSampleData";
import * as helpers from "scripts/dbManagement/helpers";
import { beforeEach, expect, suite, test, vi } from "vitest";

suite("addSampleData main function tests", () => {
	beforeEach(async () => {
		vi.resetModules();
	});

	test("should execute all operations successfully", async () => {
		// Arrange: simulate successful operations.
		const pingDBSpy = vi.spyOn(helpers, "pingDB").mockResolvedValue(true);
		const insertCollectionsSpy = vi
			.spyOn(helpers, "insertCollections")
			.mockResolvedValue(true);

		// Spy on console.log to verify the output messages.
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		// Act: call main()
		await expect(mainModule.main()).resolves.toBeUndefined();

		// Assert: verify that each helper was called as expected.
		expect(pingDBSpy).toHaveBeenCalled();
		expect(insertCollectionsSpy).toHaveBeenCalledWith([
			"users",
			"organizations",
			"organization_memberships",
			"posts",
			"post_votes",
			"post_attachments",
			"comments",
			"membership_requests",
			"comment_votes",
			"action_categories",
			"events",
			"recurrence_rules",
			"recurring_event_templates",
			"recurring_event_instances",
			"event_volunteers",
			"event_volunteer_memberships",
			"action_items",
			"notification_templates",
		]);

		// Verify that success messages are logged (exact match to avoid false positives).
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"\n\x1b[32mSuccess:\x1b[0m Database connected successfully\n",
		);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"\n\x1b[32mSuccess:\x1b[0m Sample Data added to the database",
		);
		expect(consoleLogSpy).toHaveBeenCalledTimes(2);
	});

	test("should throw an error when pingDB fails", async () => {
		// Arrange: simulate failure of pingDB.
		const errorMsg = "pingDB error";
		vi.spyOn(helpers, "pingDB").mockRejectedValue(new Error(errorMsg));

		// Act & Assert: main() should throw an error indicating DB connection failure.
		await expect(mainModule.main()).rejects.toThrow(
			`Database connection failed: Error: ${errorMsg}`,
		);
	});

	test("should throw an error when insertCollections fails", async () => {
		// Arrange: pingDB succeed, but insertCollections fails.
		vi.spyOn(helpers, "pingDB").mockResolvedValue(true);
		const errorMsg = "insert error";
		vi.spyOn(helpers, "insertCollections").mockRejectedValue(
			new Error(errorMsg),
		);

		// Act & Assert: main() should throw an error indicating sample data insertion failure.
		await expect(mainModule.main()).rejects.toThrow("Error adding sample data");
	});
});

suite("addSampleData run (CLI runner) tests", () => {
	beforeEach(async () => {
		vi.resetModules();
	});

	test("run() returns 0 when main and disconnect succeed", async () => {
		vi.spyOn(helpers, "pingDB").mockResolvedValue(true);
		vi.spyOn(helpers, "insertCollections").mockResolvedValue(true);
		vi.spyOn(helpers, "disconnect").mockResolvedValue(true);
		vi.spyOn(console, "log").mockImplementation(() => {});

		await expect(mainModule.run()).resolves.toBe(0);
	});

	test("run() returns 1 when main fails", async () => {
		vi.spyOn(helpers, "pingDB").mockRejectedValue(
			new Error("connection failed"),
		);

		await expect(mainModule.run()).resolves.toBe(1);
	});

	test("run() returns 1 when disconnect fails after main succeeds", async () => {
		vi.spyOn(helpers, "pingDB").mockResolvedValue(true);
		vi.spyOn(helpers, "insertCollections").mockResolvedValue(true);
		vi.spyOn(helpers, "disconnect").mockRejectedValue(
			new Error("disconnect failed"),
		);
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});

		await expect(mainModule.run()).resolves.toBe(1);
	});
});
