import { afterEach } from "node:test";
import dotenv from "dotenv";
import * as helpers from "src/utilities/dbManagement/helpers";
import mockMembership from "src/utilities/dbManagement/sample_data/organization_memberships.json";
import mockOrganization from "src/utilities/dbManagement/sample_data/organizations.json";
import mockUser from "src/utilities/dbManagement/sample_data/users.json";
import { beforeEach, describe, expect, it, vi } from "vitest";
dotenv.config();
// Mock the database query
vi.mock("../src/utils/db", () => ({
	db: {
		query: {
			organizationsTable: {
				findMany: vi.fn().mockResolvedValue(mockOrganization),
			},
		},
	},
}));

describe("Database Mocking", () => {
	beforeEach(async () => {
		vi.restoreAllMocks();
		vi.resetModules();
		vi.unstubAllEnvs();
	});
	afterEach(async () => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	/*
	 * Parse Date function
	 *
	 */

	it("should correctly parse a valid date string", () => {
		expect(helpers.parseDate("2025-02-20")).toEqual(new Date("2025-02-20"));
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
		await new Promise((resolve) => setTimeout(resolve, 3000));
		expect(response).toBe(true);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"\nRecord Counts Current Import:\n",
		);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			`| organization_memberships    | ${mockMembership.length + mockOrganization.length}             |`,
		);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			`| users                       | ${mockUser.length + 1}             |`,
		);
		expect(consoleLogSpy).toHaveBeenCalledWith(
			`| organizations               | ${mockOrganization.length}              |`,
		);
	});

	/*
	 * Set Correct Envrironment
	 *
	 */

	it("should set the correct host for the test environment", async () => {
		vi.stubEnv("NODE_ENV", "test");
		vi.resetModules(); // Reset module cache
		const helpers = await import("src/utilities/dbManagement/helpers");
		expect(helpers.queryClient.options.host[0]).toBe(
			process.env.API_POSTGRES_TEST_HOST,
		);
	});

	it("should set the correct host for the production environment", async () => {
		vi.stubEnv("NODE_ENV", "production");
		vi.resetModules(); // Reset module cache
		const helpers = await import("src/utilities/dbManagement/helpers");
		expect(helpers.queryClient.options.host[0]).toBe(
			process.env.API_POSTGRES_HOST,
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
		await new Promise((resolve) => setTimeout(resolve, 1000));
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
	});

	it("should throw error if executed production database", async () => {
		vi.stubEnv("NODE_ENV", "production");

		await expect(helpers.formatDatabase()).rejects.toThrow(
			"Restricted: Resetting the database in production is not allowed",
		);
	});

	/*
	 * Disconnect function
	 *
	 */

	it("should return true if disconnected from the databases successful", async () => {
		const response = await helpers.disconnect();
		expect(response).toBe(true);
	});

	it("should return false if an error occurs during disconnection", async () => {
		// Mock queryClient.end() to throw an error
		vi.spyOn(helpers.queryClient, "end").mockRejectedValue(
			new Error("Database disconnection failed"),
		);

		const response = await helpers.disconnect();
		expect(response).toBe(false);
	});
});
