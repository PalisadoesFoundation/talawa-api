import { beforeEach, describe, expect, it, vi } from "vitest";

const { readFileMock, writeFileMock, accessMock, copyFileMock } = vi.hoisted(
	() => ({
		readFileMock: vi.fn(),
		writeFileMock: vi.fn(),
		accessMock: vi.fn(),
		copyFileMock: vi.fn(),
	}),
);

vi.mock("node:fs", () => {
	const promises = {
		readFile: readFileMock,
		writeFile: writeFileMock,
		access: accessMock,
		copyFile: copyFileMock,
	};
	return {
		promises: promises,
		default: {
			promises: promises,
		},
	};
});

import { updateEnvVariable } from "scripts/setup/updateEnvVariable";

describe("updateEnvVariable", () => {
	let envFileName: string;
	let backupFile: string;

	beforeEach(() => {
		envFileName = process.env.NODE_ENV === "test" ? ".env_test" : ".env";
		backupFile = `${envFileName}.backup`;
		vi.resetAllMocks();

		// Default mock implementations
		accessMock.mockResolvedValue(undefined);
		copyFileMock.mockResolvedValue(undefined);
		readFileMock.mockResolvedValue("EXISTING_VAR=old_value");
		writeFileMock.mockResolvedValue(undefined);
	});

	it("should update an existing variable in .env", async () => {
		await updateEnvVariable({ EXISTING_VAR: "new_value" });

		expect(writeFileMock).toHaveBeenCalledWith(
			envFileName,
			expect.stringContaining("EXISTING_VAR=new_value"),
			"utf8",
		);
		expect(process.env.EXISTING_VAR).toBe("new_value");
	});

	it("should add a new variable if it does not exist", async () => {
		await updateEnvVariable({ NEW_VAR: "new_value" });

		expect(writeFileMock).toHaveBeenCalledWith(
			envFileName,
			expect.stringContaining("NEW_VAR=new_value"),
			"utf8",
		);
		expect(process.env.NEW_VAR).toBe("new_value");
	});

	it("should create a backup before updating .env", async () => {
		await updateEnvVariable({ EXISTING_VAR: "new_value" });

		expect(copyFileMock).toHaveBeenCalledWith(envFileName, backupFile);
	});

	it("should restore from backup if an error occurs", async () => {
		writeFileMock.mockRejectedValueOnce(new Error("Write failed"));

		await expect(
			updateEnvVariable({ EXISTING_VAR: "new_value" }),
		).rejects.toThrow("Write failed");

		// It tries to copy backupFile back to envFileName
		expect(copyFileMock).toHaveBeenCalledWith(backupFile, envFileName);
	});

	it("should create .env if it does not exist", async () => {
		// First access fails (no file), so backup is skipped
		accessMock.mockRejectedValueOnce({ code: "ENOENT" });
		readFileMock.mockResolvedValue("");

		await updateEnvVariable({ NEW_VAR: "new_value" });

		expect(writeFileMock).toHaveBeenCalledWith(
			envFileName,
			expect.stringContaining("NEW_VAR=new_value"),
			"utf8",
		);
		expect(process.env.NEW_VAR).toBe("new_value");
	});
});
