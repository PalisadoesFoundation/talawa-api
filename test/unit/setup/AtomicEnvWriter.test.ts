import { promises as fs, type PathLike } from "node:fs";
import os from "node:os";
import path from "node:path";
import { SetupError, SetupErrorCode } from "scripts/setup/SetupError.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as AW from "../../../scripts/setup/AtomicEnvWriter.js";

const {
	atomicWriteEnv,
	cleanupBackup,
	cleanupTemp,
	commitTemp,
	errToError,
	ensureBackup,
	fileExists,
	getErrCode,
	readEnv,
	restoreBackup,
	writeTemp,
} = AW;

const ROOT = path.join(os.tmpdir(), "atomic-env-writer-tests");
const ENV = path.join(ROOT, ".env");
const BACKUP = path.join(ROOT, ".env.backup");
const TEMP = path.join(ROOT, ".env.tmp");

async function write(file: string, content: string): Promise<void> {
	await fs.writeFile(file, content, "utf-8");
}

async function read(file: string): Promise<string> {
	return fs.readFile(file, "utf-8");
}

beforeEach(async () => {
	await fs.rm(ROOT, { recursive: true, force: true });
	await fs.mkdir(ROOT, { recursive: true });
});

afterEach(async () => {
	await fs.rm(ROOT, { recursive: true, force: true });
	vi.restoreAllMocks();
});

describe("ensureBackup", () => {
	it("creates a backup when env exists", async () => {
		await write(ENV, "A=1\n");

		await ensureBackup(ENV, BACKUP);

		expect(await fileExists(BACKUP)).toBe(true);
		expect(await read(BACKUP)).toBe("A=1\n");
	});

	it("does nothing when env does not exist", async () => {
		await ensureBackup(ENV, BACKUP);
		expect(await fileExists(BACKUP)).toBe(false);
	});

	it("throws BACKUP_FAILED when backup creation fails", async () => {
		vi.spyOn(fs, "copyFile").mockRejectedValueOnce(
			Object.assign(new Error("no permissions"), { code: "EACCES" }),
		);

		await expect(ensureBackup(ENV, BACKUP)).rejects.toMatchObject({
			code: SetupErrorCode.BACKUP_FAILED,
		});
	});
});

describe("writeTemp", () => {
	it("writes content to temp file", async () => {
		await writeTemp(TEMP, "TMP=1\n");
		expect(await read(TEMP)).toBe("TMP=1\n");
	});

	it("throws FILE_OP_FAILED when writing temp file fails", async () => {
		vi.spyOn(fs, "writeFile").mockRejectedValueOnce(new Error("disk full"));

		await expect(writeTemp(TEMP, "X=1\n")).rejects.toMatchObject({
			code: SetupErrorCode.FILE_OP_FAILED,
		});
	});
});

describe("commitTemp", () => {
	it("renames temp file atomically when possible", async () => {
		await write(TEMP, "X=1\n");

		await commitTemp(ENV, TEMP);

		expect(await fileExists(TEMP)).toBe(false);
		expect(await read(ENV)).toBe("X=1\n");
	});

	it("falls back to copy+unlink on EXDEV and preserves original error", async () => {
		await write(TEMP, "Y=2\n");

		const renameSpy = vi
			.spyOn(fs, "rename")
			.mockRejectedValueOnce(
				Object.assign(new Error("EXDEV"), { code: "EXDEV" }),
			);

		await commitTemp(ENV, TEMP);

		expect(renameSpy).toHaveBeenCalled();
		expect(await fileExists(TEMP)).toBe(false);
		expect(await read(ENV)).toBe("Y=2\n");
	});

	it("throws COMMIT_FAILED when fallback copy fails", async () => {
		await write(TEMP, "Z=3\n");

		vi.spyOn(fs, "rename").mockRejectedValueOnce(new Error("rename failed"));
		vi.spyOn(fs, "copyFile").mockRejectedValueOnce(new Error("copy failed"));

		await expect(commitTemp(ENV, TEMP)).rejects.toMatchObject({
			code: SetupErrorCode.COMMIT_FAILED,
		});

		expect(await fileExists(ENV)).toBe(false);
		expect(await fileExists(TEMP)).toBe(true);
	});

	it("throws COMMIT_FAILED when fallback unlink fails after copying", async () => {
		await write(TEMP, "W=1\n");

		vi.spyOn(fs, "rename").mockRejectedValueOnce(
			Object.assign(new Error("EXDEV"), { code: "EXDEV" }),
		);
		vi.spyOn(fs, "unlink").mockRejectedValueOnce(
			Object.assign(new Error("unlink failed"), { code: "EACCES" }),
		);

		await expect(commitTemp(ENV, TEMP)).rejects.toMatchObject({
			code: SetupErrorCode.COMMIT_FAILED,
		});

		expect(await read(ENV)).toBe("W=1\n");
		expect(await fileExists(TEMP)).toBe(true);
	});
});

describe("cleanupTemp", () => {
	it("removes temp file", async () => {
		await write(TEMP, "TMP\n");
		await cleanupTemp(TEMP);
		expect(await fileExists(TEMP)).toBe(false);
	});

	it("ignores ENOENT", async () => {
		await cleanupTemp(TEMP);
		expect(await fileExists(TEMP)).toBe(false);
	});

	it("logs a warning via logger when unlink fails with non-ENOENT", async () => {
		const logger = { warn: vi.fn() };
		vi.spyOn(fs, "unlink").mockRejectedValueOnce(
			Object.assign(new Error("unlink failed"), { code: "EACCES" }),
		);

		await cleanupTemp(TEMP, logger);

		expect(logger.warn).toHaveBeenCalledWith(
			expect.stringContaining("Failed to cleanup temporary file"),
		);
	});
});

describe("cleanupBackup", () => {
	it("removes backup file", async () => {
		await write(BACKUP, "B\n");
		await cleanupBackup(BACKUP);
		expect(await fileExists(BACKUP)).toBe(false);
	});

	it("ignores ENOENT", async () => {
		await cleanupBackup(BACKUP);
		expect(await fileExists(BACKUP)).toBe(false);
	});

	it("warns when cleanup fails with non-ENOENT", async () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		vi.spyOn(fs, "unlink").mockRejectedValueOnce(
			Object.assign(new Error("unlink failed"), { code: "EACCES" }),
		);

		await cleanupBackup(BACKUP);

		expect(warnSpy).toHaveBeenCalled();
	});
});

describe("restoreBackup", () => {
	it("restores env from backup", async () => {
		await write(BACKUP, "RESTORED=1\n");
		await write(ENV, "BROKEN\n");

		await restoreBackup(ENV, BACKUP);

		expect(await read(ENV)).toBe("RESTORED=1\n");
	});

	it("does nothing when backup is missing", async () => {
		await restoreBackup(ENV, BACKUP);
		expect(await fileExists(ENV)).toBe(false);
	});

	it("throws RESTORE_FAILED when restore fails", async () => {
		vi.spyOn(fs, "copyFile").mockRejectedValueOnce(
			Object.assign(new Error("no permissions"), { code: "EACCES" }),
		);

		await expect(restoreBackup(ENV, BACKUP)).rejects.toMatchObject({
			code: SetupErrorCode.RESTORE_FAILED,
		});
	});
});

describe("atomicWriteEnv", () => {
	it("writes env atomically and creates backup", async () => {
		await write(ENV, "OLD=1\n");

		await atomicWriteEnv("NEW=2\n", {
			envFile: ENV,
			backupFile: BACKUP,
			tempFile: TEMP,
		});

		expect(await read(ENV)).toBe("NEW=2\n");
		expect(await read(BACKUP)).toBe("OLD=1\n");
		expect(await fileExists(TEMP)).toBe(false);
	});

	it("works with createBackup=false", async () => {
		await atomicWriteEnv("NO_BACKUP=1\n", {
			envFile: ENV,
			backupFile: BACKUP,
			tempFile: TEMP,
			createBackup: false,
		});

		expect(await read(ENV)).toBe("NO_BACKUP=1\n");
		expect(await fileExists(BACKUP)).toBe(false);
	});

	it("skips restore when createBackup=false and a write fails", async () => {
		await write(ENV, "SAFE=1\n");
		const copySpy = vi.spyOn(fs, "copyFile");

		vi.spyOn(fs, "writeFile").mockRejectedValueOnce(new Error("disk full"));

		await expect(
			atomicWriteEnv("FAIL=1\n", {
				envFile: ENV,
				backupFile: BACKUP,
				tempFile: TEMP,
				createBackup: false,
			}),
		).rejects.toBeInstanceOf(Error);

		expect(await read(ENV)).toBe("SAFE=1\n");
		expect(copySpy).not.toHaveBeenCalled();
	});

	it("cleans up temp and restores when commit fails after writing temp", async () => {
		await write(ENV, "ORIGINAL=1\n");

		// Force commitTemp to fail after `writeTemp` succeeds, leaving TEMP behind.
		vi.spyOn(fs, "rename").mockRejectedValueOnce(
			Object.assign(new Error("EXDEV"), { code: "EXDEV" }),
		);

		const realCopyFile = fs.copyFile.bind(fs);
		vi.spyOn(fs, "copyFile").mockImplementation(async (src, dest) => {
			if (src === TEMP && dest === ENV) {
				throw Object.assign(new Error("copy failed"), { code: "EIO" });
			}
			return realCopyFile(src, dest);
		});

		await expect(
			atomicWriteEnv("NEW=2\n", {
				envFile: ENV,
				backupFile: BACKUP,
				tempFile: TEMP,
			}),
		).rejects.toMatchObject({ code: SetupErrorCode.COMMIT_FAILED });

		expect(await read(ENV)).toBe("ORIGINAL=1\n");
		expect(await read(BACKUP)).toBe("ORIGINAL=1\n");
		expect(await fileExists(TEMP)).toBe(false);
	});

	it("does not restore when autoRestore=false", async () => {
		await write(ENV, "SAFE=1\n");

		vi.spyOn(fs, "writeFile").mockRejectedValueOnce(new Error("disk full"));

		await expect(
			atomicWriteEnv("FAIL=1\n", {
				envFile: ENV,
				backupFile: BACKUP,
				tempFile: TEMP,
				autoRestore: false,
			}),
		).rejects.toBeInstanceOf(Error);

		expect(await read(ENV)).toBe("SAFE=1\n");
	});

	it("restores backup on write failure", async () => {
		await write(ENV, "ORIGINAL=1\n");

		vi.spyOn(fs, "writeFile").mockRejectedValueOnce(new Error("write fail"));

		await expect(
			atomicWriteEnv("BAD=1\n", {
				envFile: ENV,
				backupFile: BACKUP,
				tempFile: TEMP,
			}),
		).rejects.toBeInstanceOf(Error);

		expect(await read(ENV)).toBe("ORIGINAL=1\n");
	});

	it("throws combined error when write and restore both fail", async () => {
		await write(ENV, "X=1\n");

		vi.spyOn(fs, "writeFile").mockRejectedValueOnce(new Error("write failed"));
		// force the restore to fail after write failure by inspecting copyFile args

		vi.spyOn(fs, "copyFile").mockImplementation(
			async (src: PathLike, dest: PathLike) => {
				if (src === BACKUP && dest === ENV) {
					throw new Error("restore failed");
				}
				return Promise.resolve();
			},
		);

		await expect(
			atomicWriteEnv("Y=2\n", {
				envFile: ENV,
				backupFile: BACKUP,
				tempFile: TEMP,
			}),
		).rejects.toMatchObject({
			code: SetupErrorCode.RESTORE_FAILED,
			context: expect.objectContaining({
				operation: "atomicWriteEnv",
				originalError: "Failed to write temporary file",
				restoreError: "Failed to restore .env from backup",
			}),
		});
	});
});

describe("SetupError", () => {
	it("formats detailed message with context and cause", () => {
		const err = new SetupError(
			SetupErrorCode.COMMIT_FAILED,
			"commit failed",
			{ filePath: ".env" },
			new Error("EXDEV"),
		);

		const msg = err.getDetailedMessage();

		expect(msg).toContain("COMMIT_FAILED");
		expect(msg).toContain("filePath: .env");
		expect(msg).toContain("EXDEV");
	});
});

describe("getErrCode & errToError", () => {
	it("getErrCode returns code when present", () => {
		expect(getErrCode({ code: "EACCES" })).toBe("EACCES");
	});

	it("getErrCode returns undefined for non-objects", () => {
		expect(getErrCode("boom")).toBeUndefined();
	});

	it("errToError converts non-Error values into Error", () => {
		const err = errToError("boom");
		expect(err).toBeInstanceOf(Error);
		expect(err.message).toBe("boom");
	});
});

describe("readEnv & fileExists", () => {
	it("readEnv returns empty string when file missing", async () => {
		expect(await readEnv(ENV)).toBe("");
	});

	it("readEnv throws FILE_OP_FAILED when read fails with non-ENOENT", async () => {
		vi.spyOn(fs, "readFile").mockRejectedValueOnce(
			Object.assign(new Error("no permissions"), { code: "EACCES" }),
		);

		await expect(readEnv(ENV)).rejects.toMatchObject({
			code: SetupErrorCode.FILE_OP_FAILED,
		});
	});

	it("fileExists reflects actual state", async () => {
		expect(await fileExists(ENV)).toBe(false);
		await write(ENV, "A=1\n");
		expect(await fileExists(ENV)).toBe(true);
	});
});
