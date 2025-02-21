import * as mainModule from "scripts/dbManagement/addSampleData";
import * as helpers from "scripts/dbManagement/helpers";
import { main } from "scripts/dbManagement/resetDB";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("main function", () => {
	beforeEach(async () => {
		vi.resetModules();
		await helpers.ensureAdministratorExists();
	});
	afterEach(async () => {
		vi.restoreAllMocks();
		await helpers.ensureAdministratorExists();
	});

	it("should confirm to format, format DB, restore administrator", async () => {
		vi.spyOn(helpers, "askUserToContinue").mockResolvedValueOnce(true);
		vi.spyOn(helpers, "pingDB").mockResolvedValueOnce(true);
		vi.spyOn(helpers, "ensureAdministratorExists").mockResolvedValueOnce(true);
		vi.spyOn(helpers, "formatDatabase").mockResolvedValueOnce(true);

		await main();

		expect(helpers.pingDB).toHaveBeenCalled();
		expect(helpers.ensureAdministratorExists).toHaveBeenCalled();
		expect(helpers.formatDatabase).toHaveBeenCalled();
	});

	it("should throw an error if database connection fails", async () => {
		vi.spyOn(helpers, "askUserToContinue").mockResolvedValueOnce(true);
		vi.spyOn(helpers, "pingDB").mockRejectedValueOnce(
			new Error("Connection failed"),
		);
		vi.spyOn(helpers, "ensureAdministratorExists").mockResolvedValueOnce(true);
		vi.spyOn(helpers, "formatDatabase").mockResolvedValueOnce(true);
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		await expect(main()).rejects.toThrow("Database connection failed:");

		expect(consoleErrorSpy).not.toHaveBeenCalled();
		expect(helpers.ensureAdministratorExists).not.toHaveBeenCalled();
		expect(helpers.formatDatabase).not.toHaveBeenCalled();
	});

	it("should log an error if formatting fails", async () => {
		vi.spyOn(helpers, "askUserToContinue").mockResolvedValueOnce(true);
		vi.spyOn(helpers, "pingDB").mockResolvedValueOnce(true);
		vi.spyOn(helpers, "formatDatabase").mockRejectedValueOnce(
			new Error("Format Failed"),
		);
		vi.spyOn(helpers, "ensureAdministratorExists").mockResolvedValueOnce(true);
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		await main();

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"\n\x1b[31mError: Database formatting failed\n\x1b[0m",
			expect.any(Error),
		);

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"\n\x1b[33mPreserving administrator access\x1b[0m",
		);
	});

	it("should log an error if ensuring admin fails", async () => {
		vi.spyOn(helpers, "askUserToContinue").mockResolvedValueOnce(true);
		vi.spyOn(helpers, "pingDB").mockResolvedValueOnce(true);
		vi.spyOn(helpers, "formatDatabase").mockResolvedValueOnce(true);
		vi.spyOn(helpers, "ensureAdministratorExists").mockRejectedValueOnce(
			new Error("Admin creation failed"),
		);
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		await main();

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"\nError: Administrator creation failed",
			expect.any(Error),
		);

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"\n\x1b[31mAdministrator access may be lost, try reformatting DB to restore access\x1b[0m\n",
		);
	});

	it("should not execute main() when imported", async () => {
		const disconnectSpy = vi
			.spyOn(helpers, "disconnect")
			.mockResolvedValueOnce(true);

		await import("scripts/dbManagement/resetDB");

		await new Promise((resolve) => setTimeout(resolve, 2000));
		expect(mainModule.isMain).toBe(false);
		expect(disconnectSpy).not.toHaveBeenCalled();
	});
});
