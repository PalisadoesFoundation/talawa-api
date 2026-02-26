import {
	handlePromptError,
	isBackupCreated,
	markBackupCreated,
	setBackupCreated,
} from "scripts/setup/services/sharedSetup";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("Setup -> sharedSetup", () => {
	describe("Backup State Management", () => {
		beforeEach(() => {
			// Reset backup state before each test
			setBackupCreated(false);
		});

		it("should initialize with backup not created", () => {
			expect(isBackupCreated()).toBe(false);
		});

		it("should mark backup as created", () => {
			markBackupCreated();
			expect(isBackupCreated()).toBe(true);
		});

		it("should set backup state to true", () => {
			setBackupCreated(true);
			expect(isBackupCreated()).toBe(true);
		});

		it("should set backup state to false", () => {
			setBackupCreated(true);
			expect(isBackupCreated()).toBe(true);
			setBackupCreated(false);
			expect(isBackupCreated()).toBe(false);
		});

		it("should toggle backup state multiple times", () => {
			setBackupCreated(true);
			expect(isBackupCreated()).toBe(true);
			setBackupCreated(false);
			expect(isBackupCreated()).toBe(false);
			markBackupCreated();
			expect(isBackupCreated()).toBe(true);
		});
	});

	describe("handlePromptError", () => {
		beforeEach(() => {
			setBackupCreated(false);
			vi.clearAllMocks();
		});

		afterEach(() => {
			vi.restoreAllMocks();
		});

		it("should call exit function with code 1", async () => {
			const mockExit = vi.fn(() => {
				throw new Error("Exit called");
			}) as never;

			await expect(
				handlePromptError(new Error("Test error"), mockExit),
			).rejects.toThrow("Exit called");

			expect(mockExit).toHaveBeenCalledWith(1);
			expect(mockExit).toHaveBeenCalledTimes(1);
		});

		it("should use default exit (process.exit) when no exit function provided", async () => {
			// Vitest automatically intercepts process.exit and throws, so we verify the function throws
			await expect(
				handlePromptError(new Error("Test error")),
			).rejects.toThrow();
		});

		it("should not attempt restore when backup not created", async () => {
			const mockExit = vi.fn(() => {
				throw new Error("Exit called");
			}) as never;

			setBackupCreated(false);

			await expect(
				handlePromptError(new Error("Test error"), mockExit),
			).rejects.toThrow("Exit called");

			expect(mockExit).toHaveBeenCalledWith(1);
		});

		it("should attempt restore when backup is created", async () => {
			const mockExit = vi.fn(() => {
				throw new Error("Exit called");
			}) as never;

			// Mock the atomicRestoreBackup function
			const mockAtomicRestore = vi.fn().mockResolvedValue(undefined);
			vi.doMock("../AtomicEnvWriter", () => ({
				restoreBackup: mockAtomicRestore,
			}));

			setBackupCreated(true);

			const consoleLogSpy = vi
				.spyOn(console, "log")
				.mockImplementation(() => {});

			await expect(
				handlePromptError(new Error("Test error"), mockExit),
			).rejects.toThrow("Exit called");

			expect(mockExit).toHaveBeenCalledWith(1);
			expect(consoleLogSpy).toHaveBeenCalledWith(
				expect.stringContaining("Original configuration restored"),
			);

			consoleLogSpy.mockRestore();
		});
	});
});
