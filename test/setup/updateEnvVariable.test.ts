import fs from "node:fs";
import { updateEnvVariable } from "scripts/setup/updateEnvVariable";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("fs");

describe("updateEnvVariable", () => {
	const envFileName = ".env";
	const backupFile = `${envFileName}.backup`;

	beforeEach(() => {
		vi.resetAllMocks();
		vi.spyOn(fs, "existsSync").mockReturnValue(true); // Assume `.env` exists
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

	it("should create a backup before updating .env", () => {
		const copySpy = vi.spyOn(fs, "copyFileSync").mockImplementation(() => {});
		vi.spyOn(fs, "readFileSync").mockReturnValue("EXISTING_VAR=old_value");

		updateEnvVariable({ EXISTING_VAR: "new_value" });

		expect(copySpy).toHaveBeenCalledWith(envFileName, backupFile);
	});

	it("should restore from backup if an error occurs", () => {
		const copySpy = vi.spyOn(fs, "copyFileSync").mockImplementation(() => {});
		vi.spyOn(fs, "readFileSync").mockReturnValue("EXISTING_VAR=old_value");
		vi.spyOn(fs, "writeFileSync").mockImplementation(() => {
			throw new Error("Write failed");
		});

		expect(() => updateEnvVariable({ EXISTING_VAR: "new_value" })).toThrow(
			"Write failed",
		);

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

	it("should properly quote values with spaces and special characters", () => {
		vi.spyOn(fs, "readFileSync").mockReturnValue("EXISTING_VAR=old_value");
		const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});

		updateEnvVariable({
			SPACE_VAR: "value with spaces",
			QUOTE_VAR: 'value with "quotes"',
		});

		expect(writeSpy).toHaveBeenCalledWith(
			envFileName,
			expect.stringContaining('SPACE_VAR="value with spaces"'),
			"utf8",
		);
		expect(writeSpy).toHaveBeenCalledWith(
			envFileName,
			expect.stringContaining('QUOTE_VAR="value with \\"quotes\\""'),
			"utf8",
		);
	});

	describe("quoteIfNeeded", () => {
		let quoteIfNeeded: (value: string | number) => string;

		beforeEach(() => {
			quoteIfNeeded = (value: string | number): string => {
				const stringValue = String(value);
				if (
					typeof value === "string" &&
					(stringValue.includes(" ") ||
						stringValue.includes('"') ||
						stringValue.includes("'"))
				) {
					return `"${stringValue.replace(/"/g, '\\"')}"`;
				}
				return String(value);
			};
		});

		it("should not quote simple values", () => {
			expect(quoteIfNeeded("simple")).toBe("simple");
			expect(quoteIfNeeded("no_special_chars")).toBe("no_special_chars");
		});

		it("should quote values with spaces", () => {
			expect(quoteIfNeeded("hello world")).toBe('"hello world"');
			expect(quoteIfNeeded("spaces in text")).toBe('"spaces in text"');
		});

		it("should escape and quote values with double quotes", () => {
			expect(quoteIfNeeded('text with "quotes"')).toBe(
				'"text with \\"quotes\\""',
			);
			expect(quoteIfNeeded('just"quote')).toBe('"just\\"quote"');
		});

		it("should quote values with single quotes", () => {
			expect(quoteIfNeeded("it's a value")).toBe('"it\'s a value"');
		});

		it("should convert numeric values to strings without quotes", () => {
			expect(quoteIfNeeded(123)).toBe("123");
			expect(quoteIfNeeded(-45.67)).toBe("-45.67");
		});
	});
});
