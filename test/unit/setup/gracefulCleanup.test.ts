import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type MockInstance,
	vi,
} from "vitest";

// Mock AtomicEnvWriter before importing setup
vi.mock("scripts/setup/AtomicEnvWriter", () => ({
	cleanupTemp: vi.fn(),
	restoreBackup: vi.fn(),
	ensureBackup: vi.fn(),
	writeTemp: vi.fn(),
	commitTemp: vi.fn(),
}));

describe("gracefulCleanup", () => {
	let gracefulCleanup: (signal?: string) => Promise<void>;
	let resetCleanupState: (options?: {
		backupCreated?: boolean;
		cleaning?: boolean;
	}) => void;
	let cleanupTempMock: MockInstance;
	let atomicRestoreBackupMock: MockInstance;
	let consoleLogSpy: MockInstance;
	let consoleWarnSpy: MockInstance;
	let consoleErrorSpy: MockInstance;
	let processExitSpy: MockInstance;

	beforeEach(async () => {
		// Get the mocked AtomicEnvWriter functions
		const { cleanupTemp, restoreBackup } = await import(
			"scripts/setup/AtomicEnvWriter"
		);
		cleanupTempMock = cleanupTemp as unknown as MockInstance;
		atomicRestoreBackupMock = restoreBackup as unknown as MockInstance;

		// Reset mocks
		cleanupTempMock.mockReset();
		atomicRestoreBackupMock.mockReset();

		// Import setup module and get exported functions
		const setupModule = await import("scripts/setup/setup");
		gracefulCleanup = setupModule.gracefulCleanup;
		resetCleanupState = setupModule.resetCleanupState;

		// Reset internal state before each test
		resetCleanupState({ backupCreated: false, cleaning: false });

		// Spy on console methods
		consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
		consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
		consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		// Spy on process.exit to prevent actual exit
		processExitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
			throw new Error("process.exit called");
		}) as unknown as never);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should call gracefulCleanup with SIGTERM and log signal-specific message", async () => {
		// Set backupCreated to true
		resetCleanupState({ backupCreated: true, cleaning: false });

		// Mock AtomicEnvWriter functions to succeed
		cleanupTempMock.mockResolvedValue(undefined);
		atomicRestoreBackupMock.mockResolvedValue(undefined);

		try {
			// Call gracefulCleanup with SIGTERM
			await gracefulCleanup("SIGTERM");
		} catch (error) {
			// Expect process.exit to have been called
			expect((error as Error).message).toBe("process.exit called");
		}

		// Assert console.log was called with the signal-specific message
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"\n\n⚠️  Setup interrupted by user (CTRL+C) - SIGTERM received. Cleaning up...",
		);

		// Assert cleanupTemp was called
		expect(cleanupTempMock).toHaveBeenCalledWith(".env.tmp");

		// Assert atomicRestoreBackup was called (because backupCreated = true)
		expect(atomicRestoreBackupMock).toHaveBeenCalledWith(".env", ".env.backup");

		// Assert success message was logged
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"✅ Original configuration restored successfully",
		);

		// Assert process.exit was called with 0 (success)
		expect(processExitSpy).toHaveBeenCalledWith(0);
	});

	it("should handle cleanupTemp throwing error and continue to restore backup", async () => {
		// Set backupCreated to true so restore is attempted
		resetCleanupState({ backupCreated: true, cleaning: false });

		// Mock cleanupTemp to throw an error
		const tempError = new Error("Failed to cleanup temp file");
		cleanupTempMock.mockRejectedValue(tempError);

		// Mock atomicRestoreBackup to succeed
		atomicRestoreBackupMock.mockResolvedValue(undefined);

		try {
			// Call gracefulCleanup
			await gracefulCleanup(undefined);
		} catch (error) {
			// Process.exit throws, which is expected
			expect((error as Error).message).toBe("process.exit called");
		}

		// Assert console.warn was called with the temp error message
		expect(consoleWarnSpy).toHaveBeenCalledWith(
			"⚠️  Failed to clean temp file:",
			tempError,
		);

		// Assert atomicRestoreBackup was still attempted
		expect(atomicRestoreBackupMock).toHaveBeenCalledWith(".env", ".env.backup");

		// Assert success message was logged (restore succeeded)
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"✅ Original configuration restored successfully",
		);

		// Assert process.exit was called with 0 (success) since restore succeeded
		expect(processExitSpy).toHaveBeenCalledWith(0);
	});

	it("should log 'No backup to restore' message when backupCreated is false", async () => {
		// Set backupCreated to false
		resetCleanupState({ backupCreated: false, cleaning: false });

		// Mock cleanupTemp to succeed
		cleanupTempMock.mockResolvedValue(undefined);

		try {
			// Call gracefulCleanup with undefined signal
			await gracefulCleanup(undefined);
		} catch (error) {
			expect((error as Error).message).toBe("process.exit called");
		}

		// Assert console.log shows the no backup message
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"✓ Cleanup complete. No backup to restore.",
		);

		// Assert atomicRestoreBackup was NOT called
		expect(atomicRestoreBackupMock).not.toHaveBeenCalled();

		// Assert cleanupTemp was still called
		expect(cleanupTempMock).toHaveBeenCalledWith(".env.tmp");

		// Assert process.exit was called with 0
		expect(processExitSpy).toHaveBeenCalledWith(0);
	});

	it("should handle atomicRestoreBackup failure and exit with code 1", async () => {
		// Set backupCreated to true so restore is attempted
		resetCleanupState({ backupCreated: true, cleaning: false });

		// Mock cleanupTemp to succeed
		cleanupTempMock.mockResolvedValue(undefined);

		// Mock atomicRestoreBackup to throw an error
		const restoreError = new Error("Failed to restore from backup");
		atomicRestoreBackupMock.mockRejectedValue(restoreError);

		try {
			// Call gracefulCleanup
			await gracefulCleanup(undefined);
		} catch (error) {
			expect((error as Error).message).toBe("process.exit called");
		}

		// Assert cleanupTemp was called
		expect(cleanupTempMock).toHaveBeenCalledWith(".env.tmp");

		// Assert atomicRestoreBackup was attempted
		expect(atomicRestoreBackupMock).toHaveBeenCalledWith(".env", ".env.backup");

		// Assert console.error was called with the error
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"✗ Cleanup encountered errors:",
			restoreError,
		);

		// Assert process.exit was called with 1 (failure)
		expect(processExitSpy).toHaveBeenCalledWith(1);
	});

	it("should be idempotent - calling twice should only execute once", async () => {
		// Set backupCreated to false for simpler test
		resetCleanupState({ backupCreated: false, cleaning: false });

		// Mock the functions
		cleanupTempMock.mockResolvedValue(undefined);

		// Create a promise that won't resolve immediately to simulate concurrent calls
		let resolveCleanup: () => void = () => {};
		const cleanupPromise = new Promise<void>((resolve) => {
			resolveCleanup = resolve;
		});
		cleanupTempMock.mockReturnValue(cleanupPromise);

		// First call
		const firstCall = gracefulCleanup(undefined).catch(() => {
			// Expected - process.exit throws
		});

		// Immediate second call (should be ignored due to cleaning flag)
		const secondCall = gracefulCleanup(undefined).catch(() => {
			// Expected - process.exit throws or returns early
		});

		// Resolve the cleanup
		resolveCleanup();

		await Promise.all([firstCall, secondCall]);

		// Assert cleanupTemp was only called once
		expect(cleanupTempMock).toHaveBeenCalledTimes(1);
	});

	it("should log initial message with undefined signal", async () => {
		// Set backupCreated to false
		resetCleanupState({ backupCreated: false, cleaning: false });

		// Mock the functions
		cleanupTempMock.mockResolvedValue(undefined);

		try {
			await gracefulCleanup(undefined);
		} catch (error) {
			expect((error as Error).message).toBe("process.exit called");
		}

		// Assert console.log was called with message for undefined signal
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"\n\n⚠️  Setup interrupted by user (CTRL+C)",
		);
	});

	it("should handle synchronous error thrown from cleanupTemp", async () => {
		// Set backupCreated to false
		resetCleanupState({ backupCreated: false, cleaning: false });

		// Mock cleanupTemp to throw synchronously (simulates immediate failure)
		// Note: Even synchronous throws from await-ed functions are caught by try-catch
		const internalError = new Error("Synchronous failure");
		cleanupTempMock.mockImplementation(() => {
			throw internalError;
		});

		try {
			await gracefulCleanup(undefined);
		} catch (error) {
			expect((error as Error).message).toBe("process.exit called");
		}

		// Assert console.warn was called (inner try-catch intercepts the error)
		expect(consoleWarnSpy).toHaveBeenCalledWith(
			"⚠️  Failed to clean temp file:",
			internalError,
		);

		// Assert that cleanup continued and completed successfully
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"✓ Cleanup complete. No backup to restore.",
		);

		// Assert process.exit was called with 0 (success, since no backup to restore)
		expect(processExitSpy).toHaveBeenCalledWith(0);
	});

	it("should exercise outer catch block when both cleanupTemp and atomicRestoreBackup fail", async () => {
		// Set backupCreated to true
		resetCleanupState({ backupCreated: true, cleaning: false });

		// Mock both to fail
		const tempError = new Error("Temp cleanup failed");
		const restoreError = new Error("Restore failed");
		cleanupTempMock.mockRejectedValue(tempError);
		atomicRestoreBackupMock.mockRejectedValue(restoreError);

		try {
			await gracefulCleanup(undefined);
		} catch (error) {
			expect((error as Error).message).toBe("process.exit called");
		}

		// Assert console.warn was called for temp error
		expect(consoleWarnSpy).toHaveBeenCalledWith(
			"⚠️  Failed to clean temp file:",
			tempError,
		);

		// Assert console.error was called for the outer catch
		expect(consoleErrorSpy).toHaveBeenCalledWith(
			"✗ Cleanup encountered errors:",
			restoreError,
		);

		// Assert process.exit was called with 1
		expect(processExitSpy).toHaveBeenCalledWith(1);
	});

	it("should call gracefulCleanup with SIGINT and log signal-specific message", async () => {
		// Set backupCreated to true
		resetCleanupState({ backupCreated: true, cleaning: false });

		// Mock AtomicEnvWriter functions to succeed
		cleanupTempMock.mockResolvedValue(undefined);
		atomicRestoreBackupMock.mockResolvedValue(undefined);

		try {
			// Call gracefulCleanup with SIGINT
			await gracefulCleanup("SIGINT");
		} catch (error) {
			expect((error as Error).message).toBe("process.exit called");
		}

		// Assert console.log was called with the signal-specific message
		expect(consoleLogSpy).toHaveBeenCalledWith(
			"\n\n⚠️  Setup interrupted by user (CTRL+C) - SIGINT received. Cleaning up...",
		);

		// Assert process.exit was called with 0 (success)
		expect(processExitSpy).toHaveBeenCalledWith(0);
	});
});
