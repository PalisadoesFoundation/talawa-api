import fs from "node:fs";
import inquirer from "inquirer";
import { setup } from "scripts/setup/setup";
import { updateEnvVariable } from "scripts/setup/updateEnvVariable";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("inquirer");
vi.mock("scripts/setup/envFileBackup/envFileBackup", () => ({
	envFileBackup: vi.fn().mockResolvedValue(true),
}));
vi.mock("node:fs");
vi.mock("scripts/setup/updateEnvVariable", () => ({
	updateEnvVariable: vi.fn(),
}));
vi.mock("env-schema", () => ({
	envSchema: () => ({
		API_GRAPHQL_SCALAR_FIELD_COST: 1,
		API_GRAPHQL_SCALAR_RESOLVER_FIELD_COST: 1,
		API_GRAPHQL_OBJECT_FIELD_COST: 1,
		API_GRAPHQL_LIST_FIELD_COST: 1,
		API_GRAPHQL_NON_PAGINATED_LIST_FIELD_COST: 1,
		API_GRAPHQL_MUTATION_BASE_COST: 1,
		API_GRAPHQL_SUBSCRIPTION_BASE_COST: 1,
	}),
}));

describe("Setup Error Handling", () => {
	let originalEnv: NodeJS.ProcessEnv;

	beforeEach(() => {
		originalEnv = { ...process.env };
		process.env.CI = "true"; // Skip interactive parts
		vi.clearAllMocks();
		vi.spyOn(fs, "existsSync").mockReturnValue(false);
		vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
		vi.spyOn(fs, "readFileSync").mockReturnValue("");
		vi.spyOn(fs.promises, "access").mockResolvedValue(undefined);
	});

	afterEach(() => {
		process.env = originalEnv;
		vi.restoreAllMocks();
	});

	it("should propagate errors from updateEnvVariable", async () => {
		// Mock prompt success with minimal answers
		vi.spyOn(inquirer, "prompt").mockResolvedValue({
			CI: "false",
			useDefaultApi: true,
			useDefaultMinio: true,
			useDefaultPostgres: true,
			useDefaultCloudbeaver: true,
			useDefaultCaddy: true,
			envReconfigure: true,
		});

		// Mock updateEnvVariable failure
		vi.mocked(updateEnvVariable).mockRejectedValue(new Error("Write Failed"));

		await expect(setup()).rejects.toThrow("Write Failed");
	});
});
