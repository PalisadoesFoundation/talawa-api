import { sql } from "drizzle-orm";
import { main } from "scripts/dbManagement/addSampleData";
import type { EnvConfig } from "src/envConfigSchema";
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
vi.mock("env-schema", async (importOriginal) => {
	const actual = await importOriginal();
	return {
		...(actual as Record<string, unknown>),
		default: vi.fn(
			(): Partial<EnvConfig> => ({
				API_POSTGRES_HOST: "postgres-test",
				API_POSTGRES_PORT: 5432,
				API_POSTGRES_PASSWORD: "password",
				API_ADMINISTRATOR_USER_EMAIL_ADDRESS: "adminstrator@email.com",
				API_ADMINISTRATOR_USER_PASSWORD: "password",
			}),
		),
	};
});

import * as mainModule from "scripts/dbManagement/addSampleData";
import * as helpers from "scripts/dbManagement/helpers";

describe.sequential("main function", () => {
	beforeAll(async () => {
		await helpers.db.transaction(async (trx) => {
			console.log("created transaction");
			await trx.execute(sql`BEGIN;`);
		});
	});
	beforeEach(async () => {
		vi.resetModules();
	});
	afterEach(async () => {
		vi.restoreAllMocks();
	});
	afterAll(async () => {
		await helpers.db.transaction(async (trx) => {
			await trx.execute(sql`ROLLBACK;`);
			console.log("rolledback");
		});
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

	it("should handle concurrent sample data insertion attempts", async () => {
		vi.spyOn(helpers, "pingDB").mockResolvedValue(true);
		vi.spyOn(helpers, "ensureAdministratorExists").mockResolvedValue(true);
		vi.spyOn(helpers, "insertCollections").mockResolvedValue(true);

		// Create multiple concurrent insertion attempts
		const attempts = Array(3)
			.fill(null)
			.map(() => main());

		await expect(Promise.all(attempts)).resolves.not.toThrow();
		expect(helpers.insertCollections).toHaveBeenCalledTimes(3);
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
