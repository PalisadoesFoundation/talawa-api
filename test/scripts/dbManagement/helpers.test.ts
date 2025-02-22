import fs from "node:fs/promises";
import readline from "node:readline";
import { sql } from "drizzle-orm";
import mockMembership from "scripts/dbManagement/sample_data/organization_memberships.json";
import mockOrganization from "scripts/dbManagement/sample_data/organizations.json";
import mockUser from "scripts/dbManagement/sample_data/users.json";
import type { EnvConfig } from "src/envConfigSchema";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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

import * as helpers from "scripts/dbManagement/helpers";

describe.sequential("Database Mocking", () => {
	beforeAll(async() => {
		await helpers.db.transaction(async (trx) => {
			console.log("created transaction");
			await trx.execute(sql`BEGIN;`);
		});
	});
		
	beforeEach(async () => {
		vi.restoreAllMocks();
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

	/*
	 * Ask User to Continue function
	 *
	 */

	it("should return true when user inputs 'y'", async () => {
		const mockInterface = {
			question: vi.fn().mockImplementation((_question, callback) => {
				callback("y");
			}),
			close: vi.fn(),
		};

		vi.spyOn(readline, "createInterface").mockReturnValue(
			mockInterface as unknown as readline.Interface,
		);

		const result = await helpers.askUserToContinue("Do you want to continue?");
		expect(result).toBe(true);
		expect(mockInterface.close).toHaveBeenCalled();
	});
	it("should return false when user inputs 'n'", async () => {
		// Mock readline interface
		const mockInterface = {
			question: vi.fn().mockImplementation((_question, callback) => {
				callback("n"); // Simulate user input 'n'
			}),
			close: vi.fn(),
		};

		vi.spyOn(readline, "createInterface").mockReturnValue(
			mockInterface as unknown as readline.Interface,
		);

		const result = await helpers.askUserToContinue("Do you want to continue?");
		expect(result).toBe(false);
		expect(mockInterface.close).toHaveBeenCalled();
	});

	/*
	 * Parse Date function
	 *
	 */

	it("should handle dates with different formats", () => {
		expect(helpers.parseDate("2025/02/20")).toEqual(new Date("2025-02-20"));
	});

	it("should handle timezone edge cases", () => {
		const date = new Date("2025-02-20T23:59:59.999Z");
		expect(helpers.parseDate(date.toISOString())).toEqual(date);
	});

	it("should correctly parse a valid timestamp", () => {
		const timestamp = 1708387200000; // Example timestamp
		expect(helpers.parseDate(timestamp)).toEqual(new Date(timestamp));
	});

	it("should correctly parse a valid Date object", () => {
		const date = new Date();
		expect(helpers.parseDate(date)).toEqual(date);
	});

	it("should return null for an invalid date string", () => {
		expect(helpers.parseDate("invalid-date")).toBeNull();
	});

	/*
	 * List Sample Data function
	 *
	 */

	it("should list sample data", async () => {
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		const response = await helpers.listSampleData();
		expect(response).toBe(true);
		expect(consoleLogSpy).toHaveBeenCalledWith("Sample Data Files:\n");
		expect(consoleLogSpy).toHaveBeenCalledWith(
			`| organization_memberships.json| ${mockMembership.length}             |`,
		);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			`| users.json                  | ${mockUser.length}             |`,
		);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			`| organizations.json          | ${mockOrganization.length}              |`,
		);
	});

	it("should handle an error while listing sample data", async () => {
		vi.spyOn(fs, "readdir").mockRejectedValue(
			new Error("Failed to read directory"),
		);

		await expect(helpers.listSampleData()).rejects.toThrow(
			"Error listing sample data: Error: Failed to read directory",
		);

		vi.restoreAllMocks();
	});

	/*
	 *	Connect to DB
	 *
	 */

	it("should return true when the database is reachable", async () => {
		vi.spyOn(helpers, "pingDB").mockResolvedValue(true);

		const result = await helpers.pingDB();
		expect(result).toBe(true);
	});

	it("should throw an error when the database is not reachable", async () => {
		vi.spyOn(helpers, "pingDB").mockRejectedValueOnce(
			new Error("Connection failed"),
		);

		await expect(helpers.pingDB).rejects.toThrow("Connection failed");
	});

	/*
	 *   Ensuring Administrator function
	 *
	 */

	it("should create an administrator user if none exists", async () => {
		const format = await helpers.formatDatabase();
		const response = await helpers.ensureAdministratorExists();
		expect(response).toBe(true);
		expect(format).toBe(true);
	});

	it("should skip if an administrator user exists", async () => {
		await helpers.formatDatabase();
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		await helpers.ensureAdministratorExists();

		const response = await helpers.ensureAdministratorExists();

		expect(consoleLogSpy).toHaveBeenCalledWith(
			"\x1b[33mFound: Administrator user already exists\x1b[0m \n",
		);
		expect(response).toBe(true);
	});

	/*
	 * List Database function
	 *
	 */

	it("should return values from the database", async () => {
		const collections = ["users", "organizations", "organization_memberships"];
		await helpers.formatDatabase();
		await helpers.ensureAdministratorExists();
		await helpers.insertCollections(collections);

		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		const response = await helpers.checkDataSize("Current");

		expect(response).toBe(true);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"\nRecord Counts Current Import:\n",
		);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			`| organization_memberships    | ${
				mockMembership.length + mockOrganization.length
			}             |`,
		);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			`| users                       | ${mockUser.length + 1}             |`,
		);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			`| organizations               | ${mockOrganization.length}              |`,
		);
	});

	/*
	 * Format Database function
	 *
	 */

	it("should return 0 values from the database if format is success", async () => {
		const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		const format = await helpers.formatDatabase();
		const response = await helpers.checkDataSize("Current");

		expect(format).toBe(true);
		expect(response).toBe(false);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"\nRecord Counts Current Import:\n",
		);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"| organization_memberships    | 0              |",
		);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"| users                       | 0              |",
		);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"| organizations               | 0              |",
		);
		await helpers.ensureAdministratorExists();
	});

	it("should throw an error if an issue occurs during database formatting", async () => {
		vi.spyOn(helpers.db, "transaction").mockImplementation(async () => {
			throw new Error("Restricted");
		});

		await expect(helpers.formatDatabase()).resolves.toBe(false);

		vi.restoreAllMocks();
	});
});
