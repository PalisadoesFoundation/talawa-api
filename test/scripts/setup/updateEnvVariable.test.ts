import fs from "node:fs";
import path from "node:path";
import { updateEnvVariable } from "scripts/setup/updateEnvVariable";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("fs");

describe("updateEnvVariable", () => {
	const envFileName = ".env_test";
	const envFilePath = path.resolve(process.cwd(), envFileName);
	const backupFile = `${envFilePath}.backup`;

	beforeEach(() => {
		vi.resetAllMocks();
		vi.spyOn(fs, "existsSync").mockReturnValue(true); // Assume `.env` exists
	});

	it("should update an existing variable in .env", () => {
		vi.spyOn(fs, "readFileSync").mockReturnValue("EXISTING_VAR=old_value");
		const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => { });

		updateEnvVariable({ EXISTING_VAR: "new_value" });

		expect(writeSpy).toHaveBeenCalledWith(
			envFilePath,
			expect.stringContaining("EXISTING_VAR=new_value"),
			{ encoding: "utf8", flag: "w" },
		);
		expect(process.env.EXISTING_VAR).toBe("new_value");
	});

	it("should add a new variable if it does not exist", () => {
		vi.spyOn(fs, "readFileSync").mockReturnValue("EXISTING_VAR=old_value");
		const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => { });

		updateEnvVariable({ NEW_VAR: "new_value" });

		expect(writeSpy).toHaveBeenCalledWith(
			envFilePath,
			expect.stringContaining("NEW_VAR=new_value"),
			{ encoding: "utf8", flag: "w" },
		);
		expect(process.env.NEW_VAR).toBe("new_value");
	});

	it("should create a backup before updating .env", () => {
		const copySpy = vi.spyOn(fs, "copyFileSync").mockImplementation(() => { });
		vi.spyOn(fs, "readFileSync").mockReturnValue("EXISTING_VAR=old_value");

		updateEnvVariable({ EXISTING_VAR: "new_value" });

		expect(copySpy).toHaveBeenCalledWith(envFilePath, backupFile);
	});

	it("should restore from backup if an error occurs", () => {
		const copySpy = vi.spyOn(fs, "copyFileSync").mockImplementation(() => { });
		vi.spyOn(fs, "readFileSync").mockReturnValue("EXISTING_VAR=old_value");
		vi.spyOn(fs, "writeFileSync").mockImplementation(() => {
			throw new Error("Write failed");
		});

		expect(() => updateEnvVariable({ EXISTING_VAR: "new_value" })).toThrow(
			"Write failed",
		);

		expect(copySpy).toHaveBeenCalledWith(backupFile, envFilePath);
	});

	it("should create .env if it does not exist", () => {
		vi.spyOn(fs, "existsSync").mockReturnValue(false);
		const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => { });

		updateEnvVariable({ NEW_VAR: "new_value" });

		expect(writeSpy).toHaveBeenCalledWith(
			envFilePath,
			expect.stringContaining("NEW_VAR=new_value"),
			{ encoding: "utf8", flag: "w" },
		);
		expect(process.env.NEW_VAR).toBe("new_value");
	});
});
