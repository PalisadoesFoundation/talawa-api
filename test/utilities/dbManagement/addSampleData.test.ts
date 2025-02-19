// import path from "node:path";
import { main } from "src/utilities/dbManagement/addSampleData";
import * as mainModule from "src/utilities/dbManagement/addSampleData";
import * as helpers from "src/utilities/dbManagement/helpers";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// const actualScriptPath = path.resolve(
// 	process.cwd(),
// 	"src/utilities/dbManagement/addSampleData.ts",
// );

describe("main function", () => {
	beforeEach(() => {
		vi.resetModules();
	});
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should connect to the database, ensure admin exists, insert collections", async () => {
		vi.spyOn(helpers, "pingDB").mockResolvedValueOnce(undefined);
		vi.spyOn(helpers, "ensureAdministratorExists").mockResolvedValueOnce(
			undefined,
		);
		vi.spyOn(helpers, "insertCollections").mockResolvedValueOnce(undefined);

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
		vi.spyOn(helpers, "ensureAdministratorExists").mockResolvedValueOnce(
			undefined,
		);
		vi.spyOn(helpers, "insertCollections").mockResolvedValueOnce(undefined);

		const consoleErrorSpy = vi
			.spyOn(console, "error")
			.mockImplementation(() => {});

		await expect(main()).rejects.toThrow("Database connection failed:");

		expect(consoleErrorSpy).not.toHaveBeenCalled();
		expect(helpers.ensureAdministratorExists).not.toHaveBeenCalled();
		expect(helpers.insertCollections).not.toHaveBeenCalled();
	});

	it("should log an error if ensuring admin fails", async () => {
		vi.spyOn(helpers, "pingDB").mockResolvedValueOnce(undefined);
		vi.spyOn(helpers, "ensureAdministratorExists").mockRejectedValueOnce(
			new Error("Admin creation failed"),
		);
		vi.spyOn(helpers, "insertCollections").mockResolvedValueOnce(undefined);
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
		expect(helpers.insertCollections).not.toHaveBeenCalled;
	});

	it("should log an error if inserting collections fails", async () => {
		vi.spyOn(helpers, "pingDB").mockResolvedValueOnce(undefined);
		vi.spyOn(helpers, "ensureAdministratorExists").mockResolvedValueOnce(
			undefined,
		);
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
			.mockResolvedValueOnce(undefined);

		await import("src/utilities/dbManagement/addSampleData");

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
