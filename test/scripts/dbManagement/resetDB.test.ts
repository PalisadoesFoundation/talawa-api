import { sql } from "drizzle-orm";
import { main } from "scripts/dbManagement/resetDB";
import type { EnvConfig } from "src/envConfigSchema";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
	beforeEach(async () => {
		vi.resetModules();
		await helpers.db.transaction(async (trx) => {
			console.log("created transaction");
			await trx.execute(sql`BEGIN;`);
		});
		await helpers.ensureAdministratorExists();
	});
	afterEach(async () => {
		vi.restoreAllMocks();
		await helpers.ensureAdministratorExists();
		await helpers.db.transaction(async (trx) => {
			await trx.execute(sql`ROLLBACK;`);
			console.log("rolledback");
		});
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
	it("should abort when user declines to continue", async () => {
		vi.spyOn(helpers, "askUserToContinue").mockResolvedValueOnce(false);
		const formatSpy = vi.spyOn(helpers, "formatDatabase");
		const adminSpy = vi.spyOn(helpers, "ensureAdministratorExists");

		await main();

		expect(formatSpy).not.toHaveBeenCalled();
		expect(adminSpy).not.toHaveBeenCalled();
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
