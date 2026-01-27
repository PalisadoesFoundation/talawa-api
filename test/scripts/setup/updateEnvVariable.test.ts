import fs from "node:fs";
import { updateEnvVariable } from "scripts/setup/updateEnvVariable";
import { beforeEach, describe, expect, it, vi } from "vitest";

describe("updateEnvVariable", () => {
	let envFileName: string;
	let backupFile: string;

	beforeEach(() => {
		envFileName = process.env.NODE_ENV === "test" ? ".env_test" : ".env";
		backupFile = `${envFileName}.backup`;
		vi.resetAllMocks();
		// Mock fs.promises methods
		vi.spyOn(fs.promises, "access").mockResolvedValue(undefined); // Assume file exists
		vi.spyOn(fs.promises, "copyFile").mockResolvedValue(undefined);
		vi.spyOn(fs.promises, "writeFile").mockResolvedValue(undefined);
	});

	it("should update an existing variable in .env", async () => {
		vi.spyOn(fs.promises, "readFile").mockResolvedValue(
			"EXISTING_VAR=old_value",
		);

		await updateEnvVariable({ EXISTING_VAR: "new_value" });

		expect(fs.promises.writeFile).toHaveBeenCalledWith(
			envFileName,
			expect.stringContaining("EXISTING_VAR=new_value"),
			"utf8",
		);
		// Note: process.env updates are side effects, good to test if function does it.
		// Implementation sets process.env[key] = String(value);
		expect(process.env.EXISTING_VAR).toBe("new_value");
	});

	it("should add a new variable if it does not exist", async () => {
		vi.spyOn(fs.promises, "readFile").mockResolvedValue(
			"EXISTING_VAR=old_value",
		);

		await updateEnvVariable({ NEW_VAR: "new_value" });

		expect(fs.promises.writeFile).toHaveBeenCalledWith(
			envFileName,
			expect.stringContaining("NEW_VAR=new_value"),
			"utf8",
		);
		expect(process.env.NEW_VAR).toBe("new_value");
	});

	it("should create a backup before updating .env", async () => {
		vi.spyOn(fs.promises, "readFile").mockResolvedValue(
			"EXISTING_VAR=old_value",
		);

		await updateEnvVariable({ EXISTING_VAR: "new_value" });

		expect(fs.promises.copyFile).toHaveBeenCalledWith(envFileName, backupFile);
	});

	it("should restore from backup if an error occurs", async () => {
		vi.spyOn(fs.promises, "readFile").mockResolvedValue(
			"EXISTING_VAR=old_value",
		);
		vi.spyOn(fs.promises, "writeFile").mockRejectedValue(
			new Error("Write failed"),
		);

		await expect(
			updateEnvVariable({ EXISTING_VAR: "new_value" }),
		).rejects.toThrow("Write failed");

		expect(fs.promises.copyFile).toHaveBeenCalledWith(envFileName, backupFile);
		// Should verify restore (copy backup to envFile)
		expect(fs.promises.copyFile).toHaveBeenCalledWith(backupFile, envFileName);
	});

	it("should create .env if it does not exist", async () => {
		// Mock access to fail (ENOENT)
		vi.spyOn(fs.promises, "access").mockRejectedValue({ code: "ENOENT" });
		// copyFile should not be called if access fails with ENOENT?
		// Implementation catch(err): if error.code !== "ENOENT" ...
		// If ENOENT, backupCreated = false.

		// Then try to read file. If ENOENT, existingContent = "".
		vi.spyOn(fs.promises, "readFile").mockRejectedValue({ code: "ENOENT" });

		await updateEnvVariable({ NEW_VAR: "new_value" });

		expect(fs.promises.writeFile).toHaveBeenCalledWith(
			envFileName,
			expect.stringContaining("NEW_VAR=new_value"),
			"utf8",
		);
		expect(process.env.NEW_VAR).toBe("new_value");
	});
});
