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
			"comment_votes",
		]);

		// Verify that success messages are logged.
		expect(consoleLogSpy).toHaveBeenCalledWith(
			expect.stringContaining("Database connected successfully"),
		);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			expect.stringContaining("Sample Data added to the database"),
		);
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
