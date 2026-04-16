import * as EnvFileManager from "scripts/setup/envFileManager";
import { updateEnvVariable } from "scripts/setup/updateEnvVariable";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("updateEnvVariable", () => {
	let envFileName: string;

	beforeEach(() => {
		envFileName = process.env.NODE_ENV === "test" ? ".env_test" : ".env";
		vi.resetAllMocks();
	});

	it("should update an existing variable in .env", async () => {
		const internalSpy = vi
			.spyOn(EnvFileManager, "updateEnvVariable")
			.mockResolvedValue(undefined);

		await updateEnvVariable({ EXISTING_VAR: "new_value" });

		expect(internalSpy).toHaveBeenCalledWith(
			{ EXISTING_VAR: "new_value" },
			expect.objectContaining({ envFile: envFileName }),
		);
	});

	it("should add a new variable if it does not exist", async () => {
		const internalSpy = vi
			.spyOn(EnvFileManager, "updateEnvVariable")
			.mockResolvedValue(undefined);

		await updateEnvVariable({ NEW_VAR: "new_value" });

		expect(internalSpy).toHaveBeenCalledWith(
			{ NEW_VAR: "new_value" },
			expect.objectContaining({ envFile: envFileName }),
		);
	});

	it("should create a backup before updating .env", async () => {
		const internalSpy = vi
			.spyOn(EnvFileManager, "updateEnvVariable")
			.mockResolvedValue(undefined);

		await updateEnvVariable(
			{ EXISTING_VAR: "new_value" },
			{ createBackup: true },
		);

		expect(internalSpy).toHaveBeenCalledWith(
			{ EXISTING_VAR: "new_value" },
			expect.objectContaining({
				createBackup: true,
				envFile: envFileName,
			}),
		);
	});

	it("should restore from backup if an error occurs", async () => {
		vi.spyOn(EnvFileManager, "updateEnvVariable").mockRejectedValue(
			new Error("Write failed"),
		);

		await expect(
			updateEnvVariable({ EXISTING_VAR: "new_value" }),
		).rejects.toThrow(
			"Write failed",
		);
	});

	it("should create .env if it does not exist", async () => {
		const internalSpy = vi
			.spyOn(EnvFileManager, "updateEnvVariable")
			.mockResolvedValue(undefined);

		await updateEnvVariable({ NEW_VAR: "new_value" }, { envFile: ".env" });

		expect(internalSpy).toHaveBeenCalledWith(
			{ NEW_VAR: "new_value" },
			expect.objectContaining({ envFile: ".env" }),
		);
	});
});
