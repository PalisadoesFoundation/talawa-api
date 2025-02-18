import { disconnect,ensureAdministratorExists,formatDatabase } from "src/utilities/dbManagement/helpers";
import { describe, expect, it, vi } from "vitest";
import path from "node:path";
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


vi.mock("src/utilities/dbManagement/helpers", () => ({
	formatDatabase: vi.fn(),
	ensureAdministratorExists: vi.fn(),
	disconnect: vi.fn(),
}));

import "src/utilities/dbManagement/resetDB";

describe("main function", () => {
	it("should format database", async () => {
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(formatDatabase).toHaveBeenCalledTimes(1);
	});
	it("should restore administrator roles", async () => {
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(ensureAdministratorExists).toHaveBeenCalledTimes(1);
	});
	it("should disconnect database client", async () => {
		await new Promise((resolve) => setTimeout(resolve, 0));

		expect(disconnect).toHaveBeenCalledTimes(1);
	});
});
