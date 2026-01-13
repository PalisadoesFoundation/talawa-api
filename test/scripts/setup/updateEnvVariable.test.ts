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
		vi.spyOn(fs.promises, "access").mockResolvedValue(undefined); // Assume `.env` exists
	});

	it("should update an existing variable in .env", async () => {
		vi.spyOn(fs.promises, "readFile").mockResolvedValue("EXISTING_VAR=old_value");
		const writeSpy = vi
			.spyOn(fs.promises, "writeFile")
			.mockResolvedValue(undefined);
		vi.spyOn(fs.promises, "copyFile").mockResolvedValue(undefined); // Mock backup creation

		await updateEnvVariable({ EXISTING_VAR: "new_value" });

		expect(writeSpy).toHaveBeenCalledWith(
			envFileName,
			expect.stringContaining("EXISTING_VAR=new_value"),
			"utf8",
		);
		expect(process.env.EXISTING_VAR).toBe("new_value");
	});

	it("should add a new variable if it does not exist", async () => {
		vi.spyOn(fs.promises, "readFile").mockResolvedValue("EXISTING_VAR=old_value");
		const writeSpy = vi
			.spyOn(fs.promises, "writeFile")
			.mockResolvedValue(undefined);
		vi.spyOn(fs.promises, "copyFile").mockResolvedValue(undefined);

		await updateEnvVariable({ NEW_VAR: "new_value" });

		expect(writeSpy).toHaveBeenCalledWith(
			envFileName,
			expect.stringContaining("NEW_VAR=new_value"),
			"utf8",
		);
		expect(process.env.NEW_VAR).toBe("new_value");
	});

	it("should create a backup before updating .env", async () => {
		const copySpy = vi
			.spyOn(fs.promises, "copyFile")
			.mockResolvedValue(undefined);
		vi.spyOn(fs.promises, "readFile").mockResolvedValue("EXISTING_VAR=old_value");
		vi.spyOn(fs.promises, "writeFile").mockResolvedValue(undefined);

		await updateEnvVariable({ EXISTING_VAR: "new_value" });

		expect(copySpy).toHaveBeenCalledWith(envFileName, backupFile);
	});

	it("should restore from backup if an error occurs", async () => {
		const copySpy = vi
			.spyOn(fs.promises, "copyFile")
			.mockResolvedValue(undefined);
		vi.spyOn(fs.promises, "readFile").mockResolvedValue("EXISTING_VAR=old_value");
		vi.spyOn(fs.promises, "writeFile").mockRejectedValue(
			new Error("Write failed"),
		);

		await expect(updateEnvVariable({ EXISTING_VAR: "new_value" })).rejects.toThrow(
			"Write failed",
		);

		// Expect restoration copy: backup -> envFileName
		expect(copySpy).toHaveBeenCalledWith(backupFile, envFileName);
	});

	it("should create .env if it does not exist", async () => {
		vi.spyOn(fs.promises, "access").mockRejectedValue({ code: "ENOENT" });
		const writeSpy = vi
			.spyOn(fs.promises, "writeFile")
			.mockResolvedValue(undefined);
		vi.spyOn(fs.promises, "readFile").mockRejectedValue({ code: "ENOENT" });
		vi.spyOn(fs.promises, "copyFile").mockResolvedValue(undefined);

		await updateEnvVariable({ NEW_VAR: "new_value" });

		expect(writeSpy).toHaveBeenCalledWith(
			envFileName,
			expect.stringContaining("NEW_VAR=new_value"),
			"utf8",
		);
		expect(process.env.NEW_VAR).toBe("new_value");
	});
});
