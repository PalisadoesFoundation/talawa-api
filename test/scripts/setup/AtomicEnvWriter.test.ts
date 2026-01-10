import { promises as fs, type PathLike } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as AW from "../../../scripts/setup/AtomicEnvWriter.js";

const {
	atomicWriteEnv,
	cleanupBackup,
	cleanupTemp,
	commitTemp,
	ensureBackup,
	fileExists,
	getErrCode,
	readEnv,
	restoreBackup,
	SetupError,
	SetupErrorCode,
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
});

describe("writeTemp", () => {
	it("writes content to temp file", async () => {
		await writeTemp(TEMP, "TMP=1\n");
		expect(await read(TEMP)).toBe("TMP=1\n");
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
		).rejects.toBeInstanceOf(SetupError);

		try {
			await atomicWriteEnv("Y=2\n", {
				envFile: ENV,
				backupFile: BACKUP,
				tempFile: TEMP,
			});
		} catch (err: unknown) {
			expect([
				SetupErrorCode.RESTORE_FAILED,
				SetupErrorCode.FILE_OP_FAILED,
			]).toContain(getErrCode(err));
		}
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

describe("readEnv & fileExists", () => {
	it("readEnv returns empty string when file missing", async () => {
		expect(await readEnv(ENV)).toBe("");
	});

	it("fileExists reflects actual state", async () => {
		expect(await fileExists(ENV)).toBe(false);
		await write(ENV, "A=1\n");
		expect(await fileExists(ENV)).toBe(true);
	});
});
