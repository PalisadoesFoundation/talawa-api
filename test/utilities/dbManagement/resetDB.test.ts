import inquirer from "inquirer";
import * as helpers from "src/utilities/dbManagement/helpers";
import { main } from "src/utilities/dbManagement/resetDB";
import * as mainModule from "src/utilities/dbManagement/resetDB";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("main function", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should confirm to format, format DB, restore administrator", async () => {
		vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
			deleteExisting: true,
		});
		vi.spyOn(helpers, "pingDB").mockResolvedValueOnce(true);
		vi.spyOn(helpers, "ensureAdministratorExists").mockResolvedValueOnce(true);
		vi.spyOn(helpers, "formatDatabase").mockResolvedValueOnce(true);

		await main();

		expect(helpers.pingDB).toHaveBeenCalled();
		expect(helpers.ensureAdministratorExists).toHaveBeenCalled();
		expect(helpers.formatDatabase).toHaveBeenCalled();
	});

	it("should throw an error if database connection fails", async () => {
		vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
			deleteExisting: true,
		});
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
		vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
			deleteExisting: true,
		});
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
		vi.spyOn(inquirer, "prompt").mockResolvedValueOnce({
			deleteExisting: true,
		});
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

		await import("src/utilities/dbManagement/resetDB");

		await new Promise((resolve) => setTimeout(resolve, 2000));
		expect(mainModule.isMain).toBe(false);
		expect(disconnectSpy).not.toHaveBeenCalled();
	});

	// it("should execute `main()` and call `disconnect()` when script is run directly", async () => {
	// 	vi.spyOn(process, "argv", "get").mockReturnValue([
	// 		"node",
	// 		actualScriptPath,
	// 	]);
	//     const processExitSpy = vi
	//             .spyOn(process, "exit")
	//             .mockImplementation(( ) => { });

	// 	await import("src/utilities/dbManagement/addSampleData").then(async() => {
	//         await new Promise((resolve) => setTimeout(resolve, 2000));
	//         expect(mainModule.isMain).toBe(true);
	//         expect(processExitSpy).toHaveBeenCalledWith(0);
	//     });

	// });
});
