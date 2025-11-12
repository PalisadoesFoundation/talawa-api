import fs from "node:fs";
import { updateEnvVariable } from "scripts/setup/updateEnvVariable";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("fs");

describe("updateEnvVariable", () => {
	// In test mode, updateEnvVariable uses .env_test
	const envFileName = ".env_test";
	const backupFile = `${envFileName}.backup`;

	beforeEach(() => {
		vi.resetAllMocks();
		vi.spyOn(fs, "existsSync").mockReturnValue(true); // Assume `.env_test` exists
	});

	it("should update an existing variable in .env", () => {
		vi.spyOn(fs, "readFileSync").mockReturnValue("EXISTING_VAR=old_value");
		const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});

		updateEnvVariable({ EXISTING_VAR: "new_value" });

		expect(writeSpy).toHaveBeenCalledWith(
			envFileName,
			expect.stringContaining("EXISTING_VAR=new_value"),
			"utf8",
		);
		expect(process.env.EXISTING_VAR).toBe("new_value");
	});

	it("should add a new variable if it does not exist", () => {
		vi.spyOn(fs, "readFileSync").mockReturnValue("EXISTING_VAR=old_value");
		const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});

		updateEnvVariable({ NEW_VAR: "new_value" });

		expect(writeSpy).toHaveBeenCalledWith(
			envFileName,
			expect.stringContaining("NEW_VAR=new_value"),
			"utf8",
		);
		expect(process.env.NEW_VAR).toBe("new_value");
	});

	it("should create a backup before updating .env if backup doesn't exist", () => {
		// Mock existsSync to return true for .env_test, false for .env_test.backup
		vi.spyOn(fs, "existsSync").mockImplementation((path) => {
			if (path === envFileName) return true;
			if (path === backupFile) return false;
			return false;
		});
		const copySpy = vi.spyOn(fs, "copyFileSync").mockImplementation(() => {});
		vi.spyOn(fs, "readFileSync").mockReturnValue("EXISTING_VAR=old_value");

		updateEnvVariable({ EXISTING_VAR: "new_value" });

		expect(copySpy).toHaveBeenCalledWith(envFileName, backupFile);
	});

	it("should NOT create a backup if one already exists", () => {
		// Mock existsSync to return true for both .env_test and .env_test.backup
		vi.spyOn(fs, "existsSync").mockImplementation((path) => {
			if (path === envFileName) return true;
			if (path === backupFile) return true;
			return false;
		});
		const copySpy = vi.spyOn(fs, "copyFileSync").mockImplementation(() => {});
		vi.spyOn(fs, "readFileSync").mockReturnValue("EXISTING_VAR=old_value");

		updateEnvVariable({ EXISTING_VAR: "new_value" });

		// Should NOT create a backup because one already exists
		expect(copySpy).not.toHaveBeenCalled();
	});

	it("should restore from backup if an error occurs", () => {
		// Mock existsSync to return true for .env_test, false for backup initially,
		// then true for backup during restore
		let backupExists = false;
		vi.spyOn(fs, "existsSync").mockImplementation((path) => {
			if (path === envFileName) return true;
			if (path === backupFile) return backupExists;
			return false;
		});
		const copySpy = vi.spyOn(fs, "copyFileSync").mockImplementation(() => {
			// After first copy (creating backup), backup exists
			if (!backupExists) backupExists = true;
		});
		vi.spyOn(fs, "readFileSync").mockReturnValue("EXISTING_VAR=old_value");
		vi.spyOn(fs, "writeFileSync").mockImplementation(() => {
			throw new Error("Write failed");
		});

		expect(() => updateEnvVariable({ EXISTING_VAR: "new_value" })).toThrow(
			"Write failed",
		);

		// Should restore from backup on error
		expect(copySpy).toHaveBeenCalledWith(backupFile, envFileName);
	});

	it("should create .env if it does not exist", () => {
		vi.spyOn(fs, "existsSync").mockReturnValue(false);
		const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});

		updateEnvVariable({ NEW_VAR: "new_value" });

		expect(writeSpy).toHaveBeenCalledWith(
			envFileName,
			expect.stringContaining("NEW_VAR=new_value"),
			"utf8",
		);
		expect(process.env.NEW_VAR).toBe("new_value");
	});

	it("should preserve all untouched environment variables", () => {
		const existingEnvContent = `# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mydb

# API Configuration
API_KEY=secret123
API_URL=https://api.example.com

# Feature Flags
FEATURE_X=enabled
FEATURE_Y=disabled`;

		vi.spyOn(fs, "readFileSync").mockReturnValue(existingEnvContent);
		const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});

		// Only update DB_PORT
		updateEnvVariable({ DB_PORT: "3306" });

		expect(writeSpy).toHaveBeenCalled();
		const writtenContent = writeSpy.mock.calls[0]?.[1] as string;
		expect(writtenContent).toBeDefined();

		// Verify DB_PORT was updated
		expect(writtenContent).toContain("DB_PORT=3306");

		// Verify all other values are preserved exactly
		expect(writtenContent).toContain("DB_HOST=localhost");
		expect(writtenContent).toContain("DB_NAME=mydb");
		expect(writtenContent).toContain("API_KEY=secret123");
		expect(writtenContent).toContain("API_URL=https://api.example.com");
		expect(writtenContent).toContain("FEATURE_X=enabled");
		expect(writtenContent).toContain("FEATURE_Y=disabled");

		// Verify comments are preserved
		expect(writtenContent).toContain("# Database Configuration");
		expect(writtenContent).toContain("# API Configuration");
		expect(writtenContent).toContain("# Feature Flags");

		// Verify DB_PORT was NOT duplicated
		const dbPortMatches = writtenContent.match(/DB_PORT=/g);
		expect(dbPortMatches).toHaveLength(1);
	});

	it("should preserve empty lines and formatting", () => {
		const existingEnvContent = `VAR1=value1

VAR2=value2


VAR3=value3`;

		vi.spyOn(fs, "readFileSync").mockReturnValue(existingEnvContent);
		const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});

		updateEnvVariable({ VAR2: "updated_value" });

		expect(writeSpy).toHaveBeenCalled();
		const writtenContent = writeSpy.mock.calls[0]?.[1] as string;
		expect(writtenContent).toBeDefined();

		// Verify the updated variable
		expect(writtenContent).toContain("VAR2=updated_value");

		// Verify other variables are preserved
		expect(writtenContent).toContain("VAR1=value1");
		expect(writtenContent).toContain("VAR3=value3");

		// Verify empty lines are preserved
		expect(writtenContent).toMatch(/VAR1=value1\n\nVAR2=updated_value/);
	});

	it("should only update specified keys when multiple variables exist", () => {
		const existingEnvContent = `KEY_A=valueA
KEY_B=valueB
KEY_C=valueC
KEY_D=valueD
KEY_E=valueE`;

		vi.spyOn(fs, "readFileSync").mockReturnValue(existingEnvContent);
		const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});

		// Update only KEY_B and KEY_D
		updateEnvVariable({ KEY_B: "newB", KEY_D: "newD" });

		expect(writeSpy).toHaveBeenCalled();
		const writtenContent = writeSpy.mock.calls[0]?.[1] as string;
		expect(writtenContent).toBeDefined();

		// Verify updated keys
		expect(writtenContent).toContain("KEY_B=newB");
		expect(writtenContent).toContain("KEY_D=newD");

		// Verify untouched keys remain unchanged
		expect(writtenContent).toContain("KEY_A=valueA");
		expect(writtenContent).toContain("KEY_C=valueC");
		expect(writtenContent).toContain("KEY_E=valueE");

		// Verify no keys were duplicated
		expect(writtenContent.match(/KEY_A=/g)).toHaveLength(1);
		expect(writtenContent.match(/KEY_B=/g)).toHaveLength(1);
		expect(writtenContent.match(/KEY_C=/g)).toHaveLength(1);
		expect(writtenContent.match(/KEY_D=/g)).toHaveLength(1);
		expect(writtenContent.match(/KEY_E=/g)).toHaveLength(1);
	});
});
