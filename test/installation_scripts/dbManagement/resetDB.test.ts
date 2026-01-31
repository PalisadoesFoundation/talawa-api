import * as helpers from "scripts/dbManagement/helpers";
import * as resetDataModule from "scripts/dbManagement/resetData";
// tests/dbManagement/resetData.test.ts
import { beforeEach, expect, suite, test, vi } from "vitest";

suite("resetData main function tests", () => {
	beforeEach(() => {
		// Reset all mocks before each test.
		vi.resetAllMocks();
	});

	test("should cancel operation if askUserToContinue returns false", async () => {
		// Arrange: simulate the user declining the operation.
		vi.spyOn(helpers, "askUserToContinue").mockResolvedValue(false);
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		// Act: call main()
		await resetDataModule.main();

		// Assert: verify that "Operation cancelled" is logged.
		expect(consoleLogSpy).toHaveBeenCalledWith("Operation cancelled");
	});

	test("should throw error when pingDB fails", async () => {
		// Arrange: simulate user confirming and pingDB failure.
		vi.spyOn(helpers, "askUserToContinue").mockResolvedValue(true);
		vi.spyOn(helpers, "pingDB").mockRejectedValue(new Error("ping error"));

		// Act & Assert: main() should throw an error indicating DB connection failure.
		await expect(resetDataModule.main()).rejects.toThrow(
			"Database connection failed: Error: ping error",
		);
	});

	test("should log errors for failing formatDatabase, emptyMinioBucket but not throw", async () => {
		// Arrange: simulate user confirming and pingDB succeeding.
		vi.spyOn(helpers, "askUserToContinue").mockResolvedValue(true);
		vi.spyOn(helpers, "pingDB").mockResolvedValue(true);
		// Simulate failures for subsequent operations.
		vi.spyOn(helpers, "formatDatabase").mockRejectedValue(
			new Error("format error"),
		);
		vi.spyOn(helpers, "emptyMinioBucket").mockRejectedValue(
			new Error("minio error"),
		);

		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		// Act: call main(). In this case main() should resolve (it doesn't throw after pingDB),
		// and the errors should be logged.
		await expect(resetDataModule.main()).resolves.toBeUndefined();

		// Assert: verify that pingDB success was logged.
		expect(consoleLogSpy).toHaveBeenCalledWith(
			expect.stringContaining("Database connected successfully"),
		);
		// Verify errors were logged for formatting, bucket cleanup, and admin creation.
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Error: Database formatting failed"),
			expect.any(Error),
		);
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Rolled back to previous state"),
		);
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			expect.stringContaining("Error: Bucket formatting failed"),
			expect.any(Error),
		);
	});

	test("should log success messages when all operations succeed", async () => {
		// Arrange: simulate user confirming and all operations succeeding.
		vi.spyOn(helpers, "askUserToContinue").mockResolvedValue(true);
		vi.spyOn(helpers, "pingDB").mockResolvedValue(true);
		vi.spyOn(helpers, "formatDatabase").mockResolvedValue(true);
		vi.spyOn(helpers, "emptyMinioBucket").mockResolvedValue(true);

		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		// Act: call main()
		await expect(resetDataModule.main()).resolves.toBeUndefined();

		// Assert: verify that all success messages are logged.
		expect(consoleLogSpy).toHaveBeenCalledWith(
			expect.stringContaining("Database connected successfully"),
		);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			expect.stringContaining("Database formatted successfully"),
		);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			expect.stringContaining("Bucket formatted successfully"),
		);
	});
});
