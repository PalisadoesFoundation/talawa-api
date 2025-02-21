import { main } from "scripts/dbManagement/addSampleData";
import * as mainModule from "scripts/dbManagement/addSampleData";
import * as helpers from "scripts/dbManagement/helpers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("main function", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should connect to the database, ensure admin exists, insert collections", async () => {
		vi.spyOn(helpers, "pingDB").mockResolvedValueOnce(true);
		vi.spyOn(helpers, "ensureAdministratorExists").mockResolvedValueOnce(true);
		vi.spyOn(helpers, "insertCollections").mockResolvedValueOnce(true);

		await main();

		expect(helpers.pingDB).toHaveBeenCalled();
		expect(helpers.ensureAdministratorExists).toHaveBeenCalled();
		expect(helpers.insertCollections).toHaveBeenCalledWith([
			"users",
			"organizations",
			"organization_memberships",
		]);
	});

	it("should throw an error if database connection fails", async () => {
		vi.spyOn(helpers, "pingDB").mockRejectedValueOnce(
			new Error("Connection failed"),
		);
		vi.spyOn(helpers, "ensureAdministratorExists").mockResolvedValueOnce(true);
		vi.spyOn(helpers, "insertCollections").mockResolvedValueOnce(true);

		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		await expect(main()).rejects.toThrow("Database connection failed:");

		expect(consoleErrorSpy).not.toHaveBeenCalled();
		expect(helpers.ensureAdministratorExists).not.toHaveBeenCalled();
		expect(helpers.insertCollections).not.toHaveBeenCalled();
	});

	it("should log an error if ensuring admin fails", async () => {
		vi.spyOn(helpers, "pingDB").mockResolvedValueOnce(true);
		vi.spyOn(helpers, "ensureAdministratorExists").mockRejectedValueOnce(
			new Error("Admin creation failed"),
		);
		vi.spyOn(helpers, "insertCollections").mockResolvedValueOnce(true);
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		await expect(main()).rejects.toThrow(
			"\n\x1b[31mAdministrator access may be lost, try reimporting sample DB to restore access\x1b[0m\n",
		);

		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"\nError: Administrator creation failed",
			expect.any(Error),
		);
		expect(helpers.insertCollections).not.toHaveBeenCalled();
	});

	it("should log an error if inserting collections fails", async () => {
		vi.spyOn(helpers, "pingDB").mockResolvedValueOnce(true);
		vi.spyOn(helpers, "ensureAdministratorExists").mockResolvedValueOnce(true);
		vi.spyOn(helpers, "insertCollections").mockRejectedValueOnce(
			new Error("Insert collections failed"),
		);
		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		await expect(main()).rejects.toThrow("Error adding sample data");

		expect(consoleErrorSpy).toHaveBeenCalledWith("Error: ", expect.any(Error));
	});

	it("should not execute main() when imported", async () => {
		const disconnectSpy = vi
			.spyOn(helpers, "disconnect")
			.mockResolvedValueOnce(true);

		await import("scripts/dbManagement/addSampleData");

		await new Promise((resolve) => setTimeout(resolve, 2000));
		expect(mainModule.isMain).toBe(false);
		expect(disconnectSpy).not.toHaveBeenCalled();
	});
});
