import path from "node:path";
import { afterAll, describe, expect, it } from "vitest";

import {
	checkDataSize,
	disconnect,
	ensureAdministratorExists,
	listSampleData,
	parseDate,
} from "src/utilities/dbManagement/helpers";

import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "..", ".env.test") });

process.env.NODE_ENV = "test";
process.env.API_POSTGRES_TEST_HOST = "localhost";
process.env.API_POSTGRES_PORT = "5432";
process.env.API_POSTGRES_DATABASE = "talawa";
process.env.API_POSTGRES_USER = "postgres";
process.env.API_POSTGRES_PASSWORD = "password";
process.env.API_POSTGRES_SSL_MODE = "false";

process.env.API_ADMINISTRATOR_USER_EMAIL_ADDRESS = "administrator@test.com";
process.env.API_ADMINISTRATOR_USER_PASSWORD = "password";
process.env.API_ADMINISTRATOR_USER_NAME = "Admininstrator";

describe("populate script basic tests", () => {
	afterAll(async () => {
		await disconnect();
	});

	it("parseDate function should correctly parse a valid date", () => {
		const validDate = "2023-01-01T00:00:00Z";
		const parsed = parseDate(validDate);
		expect(parsed).toBeInstanceOf(Date);
		expect(parsed?.toISOString()).toBe("2023-01-01T00:00:00.000Z");
	});

	it("parseDate should return null for invalid date", () => {
		const invalidDate = "not-a-date";
		const parsed = parseDate(invalidDate);
		expect(parsed).toBeNull();
	});

	it("listSampleData should not throw an error", async () => {
		// Make sure your sample_data directory and files exist as expected
		await expect(listSampleData()).resolves.not.toThrow();
	});

	it("ensureAdministratorExists should not throw an error", async () => {
		// Creates or updates the admin user in the DB
		await expect(ensureAdministratorExists()).resolves.not.toThrow();
	});

	it("checkDataSize should return a boolean", async () => {
		const result = await checkDataSize("Before");
		expect(typeof result).toBe("boolean");
	});

	// it("populateDB should complete without throwing", async () => {
	// 	await expect(insertCollections).resolves.not.toThrow();
	// });

	it("disconnect should not throw an error", async () => {
		// Simple test for disconnecting
		await expect(disconnect()).resolves.not.toThrow();
	});
});
