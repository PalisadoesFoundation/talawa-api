import path from "node:path";
import { envFileBackup } from "scripts/setup/envFileBackup/envFileBackup";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mkdirMock, copyFileMock, accessMock } = vi.hoisted(() => {
	return {
		mkdirMock: vi.fn(),
		copyFileMock: vi.fn(),
		accessMock: vi.fn(),
	};
});

vi.mock("node:fs", async () => {
	const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
	return {
		...actual,
		default: {
			...actual,
			promises: {
				mkdir: mkdirMock,
				copyFile: copyFileMock,
				access: accessMock,
			},
		},
		promises: {
			mkdir: mkdirMock,
			copyFile: copyFileMock,
			access: accessMock,
		},
		constants: {
			F_OK: 0,
		},
	};
});

describe("envFileBackup", () => {
	const originalCwd = process.cwd;
	const cwdMock = vi.fn();

	beforeEach(() => {
		vi.resetAllMocks();

		mkdirMock.mockResolvedValue(undefined);
		copyFileMock.mockResolvedValue(undefined);
		accessMock.mockResolvedValue(undefined);

		cwdMock.mockReturnValue(path.normalize("/tmp/project"));
		process.cwd = cwdMock as () => string;
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.spyOn(Date, "now").mockReturnValue(1_731_959_200_000);
	});

	afterEach(() => {
		process.cwd = originalCwd;
		vi.restoreAllMocks();
	});

	it("should skip backup when shouldBackup is false", async () => {
		await envFileBackup(false);

		expect(mkdirMock).not.toHaveBeenCalled();
		expect(accessMock).not.toHaveBeenCalled();
		expect(copyFileMock).not.toHaveBeenCalled();
	});

	it("should create timestamped backup when env file exists", async () => {
		await envFileBackup(true);

		const backupDir = path.join(path.normalize("/tmp/project"), ".backup");
		const backupFile = path.join(backupDir, ".env.1731959200");
		const envPath = path.join(path.normalize("/tmp/project"), ".env");

		expect(mkdirMock).toHaveBeenCalledWith(backupDir, { recursive: true });
		expect(accessMock).toHaveBeenCalledWith(envPath, expect.anything());
		expect(copyFileMock).toHaveBeenCalledWith(envPath, backupFile);
	});

	it("should log message when .env file is missing", async () => {
		const envMissingError = Object.assign(new Error("missing"), {
			code: "ENOENT",
		});
		accessMock.mockRejectedValueOnce(envMissingError);
		const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		await envFileBackup(true);

		expect(logSpy).toHaveBeenCalledWith("\n  No .env file found to backup.");
		expect(copyFileMock).not.toHaveBeenCalled();
	});

	it("should throw error when backup fails unexpectedly", async () => {
		const unexpectedError = new Error("disk failure");
		copyFileMock.mockRejectedValueOnce(unexpectedError);

		await expect(envFileBackup(true)).rejects.toThrow(
			"Failed to backup .env file: disk failure",
		);
	});
});
