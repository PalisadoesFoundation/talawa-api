import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import dotenv from "dotenv";
import { SetupError, SetupErrorCode } from "scripts/setup/SetupError.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("scripts/setup/AtomicEnvWriter", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("scripts/setup/AtomicEnvWriter")>();
	return {
		...actual,
		commitTemp: vi.fn(actual.commitTemp),
	};
});

const ROOT = path.join(os.tmpdir(), `env-file-manager-tests-${process.pid}`);
const ENV = path.join(ROOT, ".env");
const BACKUP = path.join(ROOT, ".env.backup");
const TEMP = path.join(ROOT, ".env.tmp");
const TEMPLATE = path.join(ROOT, "template.env");

async function write(file: string, content: string): Promise<void> {
	await fs.writeFile(file, content, "utf-8");
}

async function read(file: string): Promise<string> {
	return fs.readFile(file, "utf-8");
}

describe("envFileManager", () => {
	const originalEnv = { ...process.env };

	beforeEach(async () => {
		await fs.rm(ROOT, { recursive: true, force: true });
		await fs.mkdir(ROOT, { recursive: true });
		process.env = { ...originalEnv };

		const { commitTemp } = await import("scripts/setup/AtomicEnvWriter");
		vi.mocked(commitTemp).mockClear();
	});

	afterEach(async () => {
		process.env = { ...originalEnv };
		vi.restoreAllMocks();
		await fs.rm(ROOT, { recursive: true, force: true });
	});

	it("checkEnvFile returns false when missing and true when present", async () => {
		const { checkEnvFile } = await import("scripts/setup/envFileManager");

		expect(await checkEnvFile(ENV)).toBe(false);
		await write(ENV, "A=1\n");
		expect(await checkEnvFile(ENV)).toBe(true);
	});

	it('initializeEnvFile writes normalized KEY="value" lines and ends with newline', async () => {
		const { initializeEnvFile } = await import("scripts/setup/envFileManager");
		await write(TEMPLATE, "KEY1=VAL1\nKEY2=VAL2\n");

		delete process.env.KEY1;
		delete process.env.KEY2;

		await initializeEnvFile({
			ci: false,
			envFile: ENV,
			backupFile: BACKUP,
			tempFile: TEMP,
			templateDevcontainerFile: TEMPLATE,
		});

		const content = await read(ENV);
		expect(content).toBe('KEY1="VAL1"\nKEY2="VAL2"\n');
		expect(content.endsWith("\n")).toBe(true);

		const parsed = dotenv.parse(content);
		expect(parsed).toEqual({ KEY1: "VAL1", KEY2: "VAL2" });
		expect(process.env.KEY1).toBe("VAL1");
		expect(process.env.KEY2).toBe("VAL2");
	});

	it("initializeEnvFile throws ENV_INIT_FAILED when CI template is missing and leaves no files behind", async () => {
		const { initializeEnvFile } = await import("scripts/setup/envFileManager");
		const missingTemplate = path.join(ROOT, "missing-template.env");

		await expect(
			initializeEnvFile({
				ci: true,
				envFile: ENV,
				backupFile: BACKUP,
				tempFile: TEMP,
				templateCiFile: missingTemplate,
			}),
		).rejects.toMatchObject({ code: SetupErrorCode.ENV_INIT_FAILED });

		await expect(fs.access(ENV)).rejects.toBeTruthy();
		await expect(fs.access(TEMP)).rejects.toBeTruthy();
	});

	it("initializeEnvFile creates backup before overwriting when restoreFromBackup=true", async () => {
		const { initializeEnvFile } = await import("scripts/setup/envFileManager");

		await write(ENV, "OLD=1\n");
		await write(TEMPLATE, "NEW=2\n");

		await initializeEnvFile({
			ci: false,
			envFile: ENV,
			backupFile: BACKUP,
			tempFile: TEMP,
			templateDevcontainerFile: TEMPLATE,
			restoreFromBackup: true,
		});

		expect(await read(BACKUP)).toBe("OLD=1\n");
		expect(await read(ENV)).toBe('NEW="2"\n');
		await expect(fs.access(TEMP)).rejects.toBeTruthy();
	});

	it("initializeEnvFile restores from backup when commit fails and restoreFromBackup=true", async () => {
		const { initializeEnvFile } = await import("scripts/setup/envFileManager");
		const { commitTemp } = await import("scripts/setup/AtomicEnvWriter");

		await write(ENV, "BEFORE=1\n");
		await write(BACKUP, "BACKUP=1\n");
		await write(TEMPLATE, "KEY=VAL\n");

		vi.mocked(commitTemp).mockRejectedValueOnce(new Error("commit failed"));

		await expect(
			initializeEnvFile({
				ci: false,
				envFile: ENV,
				backupFile: BACKUP,
				tempFile: TEMP,
				templateDevcontainerFile: TEMPLATE,
				restoreFromBackup: true,
			}),
		).rejects.toBeInstanceOf(SetupError);

		// Backup should be refreshed from the current env before overwriting.
		expect(await read(BACKUP)).toBe("BEFORE=1\n");
		// Restore should bring env back to the pre-init content.
		expect(await read(ENV)).toBe("BEFORE=1\n");

		await expect(fs.access(TEMP)).rejects.toBeTruthy();
	});

	it("updateEnvVariable updates existing keys, appends new keys, and syncs process.env", async () => {
		const { updateEnvVariable } = await import("scripts/setup/envFileManager");
		await write(ENV, "EXISTING_VAR=old_value\nKEEP=keep\n");

		await updateEnvVariable(
			{ EXISTING_VAR: "new_value", NEW_VAR: "new_value" },
			{ envFile: ENV, backupFile: BACKUP, tempFile: TEMP },
		);

		const content = await read(ENV);
		expect(content).toContain('EXISTING_VAR="new_value"');
		expect(content).toContain('KEEP="keep"');
		expect(content).toContain('NEW_VAR="new_value"');
		expect(content.endsWith("\n")).toBe(true);

		expect(process.env.EXISTING_VAR).toBe("new_value");
		expect(process.env.NEW_VAR).toBe("new_value");
	});

	it("updateEnvVariable escapes carriage returns (\\r) in values", async () => {
		const { updateEnvVariable } = await import("scripts/setup/envFileManager");

		await updateEnvVariable(
			{ A: "x\ry" },
			{ envFile: ENV, backupFile: BACKUP, tempFile: TEMP },
		);

		const content = await read(ENV);
		expect(content).toBe('A="x\\ry"\n');
		expect(content).toContain("\\r");
		expect(content).not.toContain("\r");
	});

	it("updateEnvVariable is a no-op when all config values are undefined", async () => {
		const { updateEnvVariable } = await import("scripts/setup/envFileManager");
		const { commitTemp } = await import("scripts/setup/AtomicEnvWriter");

		const missingEnv = path.join(ROOT, ".env.missing");
		await updateEnvVariable(
			{ A: undefined, B: undefined },
			{ envFile: missingEnv },
		);

		await expect(fs.access(missingEnv)).rejects.toBeTruthy();
		expect(commitTemp).not.toHaveBeenCalled();
	});

	it("updateEnvVariable is a no-op when values are unchanged (preserves comments)", async () => {
		const { updateEnvVariable } = await import("scripts/setup/envFileManager");
		const { commitTemp } = await import("scripts/setup/AtomicEnvWriter");

		const original = "# comment\nA=1\n";
		await write(ENV, original);

		await updateEnvVariable({ A: "1" }, { envFile: ENV });

		expect(await read(ENV)).toBe(original);
		expect(commitTemp).not.toHaveBeenCalled();
	});

	it("updateEnvVariable derives default backup/temp paths from envFile override", async () => {
		const { updateEnvVariable } = await import("scripts/setup/envFileManager");
		const { commitTemp } = await import("scripts/setup/AtomicEnvWriter");

		const envTest = path.join(ROOT, ".env_test");
		await write(envTest, "A=0\n");

		await updateEnvVariable(
			{ A: "1" },
			{ envFile: envTest, createBackup: true },
		);

		const backupContent = await read(`${envTest}.backup`);
		expect(backupContent).toBe("A=0\n");

		expect(commitTemp).toHaveBeenCalledWith(envTest, `${envTest}.tmp`);
	});

	it("updateEnvVariable creates a backup when createBackup=true", async () => {
		const { updateEnvVariable } = await import("scripts/setup/envFileManager");
		await write(ENV, "A=1\n");

		await updateEnvVariable(
			{ A: "2" },
			{ envFile: ENV, backupFile: BACKUP, tempFile: TEMP, createBackup: true },
		);

		const backupContent = await read(BACKUP);
		expect(backupContent).toBe("A=1\n");
	});

	it("updateEnvVariable restores from backup when commit fails and restoreFromBackup=true", async () => {
		const { updateEnvVariable } = await import("scripts/setup/envFileManager");
		const { commitTemp } = await import("scripts/setup/AtomicEnvWriter");

		await write(ENV, "BEFORE=1\n");
		await write(BACKUP, "BACKUP=1\n");

		vi.mocked(commitTemp).mockRejectedValueOnce(new Error("commit failed"));

		await expect(
			updateEnvVariable(
				{ X: "1" },
				{
					envFile: ENV,
					backupFile: BACKUP,
					tempFile: TEMP,
					restoreFromBackup: true,
				},
			),
		).rejects.toMatchObject({ code: SetupErrorCode.FILE_OP_FAILED });

		const content = await read(ENV);
		expect(content).toBe("BACKUP=1\n");

		await expect(fs.access(TEMP)).rejects.toBeTruthy();
	});
});
