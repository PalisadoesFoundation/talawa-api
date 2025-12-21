import { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	installPluginDependencies,
	installPluginDependenciesWithErrorHandling,
} from "../../src/utilities/pluginDependencyInstaller";
import { TalawaGraphQLError } from "../../src/utilities/TalawaGraphQLError";

// Create hoisted mock for spawn that returns a mock child process
const mockSpawn = vi.hoisted(() => {
	return vi.fn();
});

// Mock process.kill for Unix tests
const mockProcessKill = vi.hoisted(() => {
	return vi.fn();
});

// Helper to create a mock child process
function createMockChildProcess(
	options: {
		stdout?: string;
		stderr?: string;
		exitCode?: number;
		error?: Error;
	} = {},
) {
	const { stdout = "", stderr = "", exitCode = 0, error } = options;
	const child = new EventEmitter() as EventEmitter & {
		stdout: EventEmitter;
		stderr: EventEmitter;
		pid: number;
		kill: ReturnType<typeof vi.fn>;
		exitCode: number | null;
	};
	child.stdout = new EventEmitter();
	child.stderr = new EventEmitter();
	child.pid = 12345;
	child.kill = vi.fn();
	// Initialize exitCode to null, matching ChildProcess behavior before exit
	child.exitCode = null;

	// Schedule events to emit after the spawn call
	setImmediate(() => {
		if (stdout) child.stdout.emit("data", Buffer.from(stdout));
		if (stderr) child.stderr.emit("data", Buffer.from(stderr));
		if (error) {
			// On error, exitCode remains null (process didn't exit normally)
			child.emit("error", error);
		} else {
			// Set exitCode before emitting close, matching ChildProcess behavior
			child.exitCode = exitCode;
			child.emit("close", exitCode);
		}
	});

	return child;
}

// Mock child_process
vi.mock("node:child_process", () => ({
	spawn: mockSpawn,
}));

// Mock fs/promises
vi.mock("node:fs/promises", () => ({
	access: vi.fn(),
}));

// Mock path
vi.mock("node:path", () => ({
	default: {
		join: vi.fn((...args: string[]) => args.join("/")),
	},
}));

// Mock process.cwd
Object.defineProperty(process, "cwd", {
	value: vi.fn(() => "/test/cwd"),
	writable: true,
});

// Store original process.kill
const originalProcessKill = process.kill.bind(process);

import * as fs from "node:fs/promises";

describe("Plugin Dependency Installer", () => {
	const mockLogger = {
		info: vi.fn(),
		error: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.useRealTimers();
		// Reset the mock to return the test path
		(process.cwd as ReturnType<typeof vi.fn>).mockReturnValue("/test/cwd");
		// Reset mockSpawn to default successful state
		mockSpawn.mockReset();
		mockSpawn.mockImplementation(() =>
			createMockChildProcess({ stdout: "Dependencies installed", stderr: "" }),
		);
		// Reset process.kill mock
		mockProcessKill.mockReset();
	});

	describe("installPluginDependencies", () => {
		it("should install dependencies successfully", async () => {
			// Mock fs.access to succeed (package.json exists)
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock spawn to succeed
			mockSpawn.mockImplementation(() =>
				createMockChildProcess({
					stdout: "Dependencies installed",
					stderr: "",
				}),
			);

			const result = await installPluginDependencies("test-plugin", mockLogger);

			expect(result.success).toBe(true);
			expect(result.output).toBe("Dependencies installed");
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Installing dependencies for plugin test-plugin...",
			);
			expect(mockLogger.info).toHaveBeenCalledWith(
				"Successfully installed dependencies for plugin test-plugin",
			);
		});

		it("should skip installation when package.json does not exist", async () => {
			// Mock fs.access to fail (package.json doesn't exist)
			vi.mocked(fs.access).mockRejectedValue(new Error("ENOENT"));

			const result = await installPluginDependencies("test-plugin", mockLogger);

			expect(result.success).toBe(true);
			expect(mockLogger.info).toHaveBeenCalledWith(
				"No package.json found for plugin test-plugin, skipping dependency installation",
			);
		});

		it("should handle stderr warnings gracefully", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock spawn to return warnings in stderr (must contain 'warn' or 'warning')
			mockSpawn.mockImplementation(() =>
				createMockChildProcess({
					stdout: "Dependencies installed",
					stderr: "warn: deprecated package",
				}),
			);

			const result = await installPluginDependencies("test-plugin", mockLogger);

			expect(result.success).toBe(true);
			expect(mockLogger.error).toHaveBeenCalledWith(
				"Dependency installation warnings for test-plugin: warn: deprecated package",
			);
		});

		it("should ignore non-warning stderr", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock spawn to return stderr without 'warn' or 'warning'
			mockSpawn.mockImplementation(() =>
				createMockChildProcess({
					stdout: "Dependencies installed",
					stderr: "some info message",
				}),
			);

			const result = await installPluginDependencies("test-plugin", mockLogger);

			expect(result.success).toBe(true);
			expect(mockLogger.error).not.toHaveBeenCalled();
		});

		it("should handle exec errors", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock spawn to fail with error
			mockSpawn.mockImplementation(() =>
				createMockChildProcess({
					exitCode: 1,
					stderr: "pnpm install failed",
				}),
			);

			const result = await installPluginDependencies("test-plugin", mockLogger);

			expect(result.success).toBe(false);
			expect(result.error).toContain("pnpm install failed with exit code");
			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.stringContaining(
					"Failed to install dependencies for plugin test-plugin",
				),
			);
		});

		it("should handle unknown error types", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock spawn to emit an error event
			mockSpawn.mockImplementation(() =>
				createMockChildProcess({ error: new Error("Unknown spawn error") }),
			);

			const result = await installPluginDependencies("test-plugin", mockLogger);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Unknown spawn error");
			expect(mockLogger.error).toHaveBeenCalledWith(
				"Failed to install dependencies for plugin test-plugin: Unknown spawn error",
			);
		});

		it("should work without logger", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock spawn to succeed
			mockSpawn.mockImplementation(() =>
				createMockChildProcess({
					stdout: "Dependencies installed",
					stderr: "",
				}),
			);

			const result = await installPluginDependencies("test-plugin");

			expect(result.success).toBe(true);
			expect(result.output).toBe("Dependencies installed");
		});

		it("should handle fs.access errors during package.json check", async () => {
			// Mock fs.access to fail
			vi.mocked(fs.access).mockRejectedValue(new Error("Permission denied"));

			const result = await installPluginDependencies("test-plugin", mockLogger);

			expect(result.success).toBe(true);
			expect(mockLogger.info).toHaveBeenCalledWith(
				"No package.json found for plugin test-plugin, skipping dependency installation",
			);
		});

		it("should use correct command and options", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock spawn to succeed
			mockSpawn.mockImplementation(() =>
				createMockChildProcess({
					stdout: "Dependencies installed",
					stderr: "",
				}),
			);

			await installPluginDependencies("test-plugin", mockLogger);

			// Verify mockSpawn was called with correct parameters
			expect(mockSpawn).toHaveBeenCalledWith(
				expect.stringMatching(/^pnpm/),
				["install", "--frozen-lockfile"],
				expect.objectContaining({
					cwd: "/test/cwd/src/plugin/available/test-plugin",
				}),
			);
		});

		it("should handle timeout errors", async () => {
			vi.useFakeTimers();
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Create a child that never completes
			const child = new EventEmitter() as EventEmitter & {
				stdout: EventEmitter;
				stderr: EventEmitter;
				pid: number;
				kill: ReturnType<typeof vi.fn>;
				exitCode: number | null;
			};
			child.stdout = new EventEmitter();
			child.stderr = new EventEmitter();
			child.pid = 12345;
			child.kill = vi.fn();
			child.exitCode = null;

			mockSpawn.mockImplementation(() => {
				// Don't emit any events, simulating a hanging process
				return child;
			});

			const resultPromise = installPluginDependencies(
				"test-plugin",
				mockLogger,
			);

			// Fast-forward time to trigger timeout (5 minutes = 300000ms)
			await vi.advanceTimersByTimeAsync(300000);

			const result = await resultPromise;

			expect(result.success).toBe(false);
			expect(result.error).toBe("Installation timed out after 5 minutes");

			vi.useRealTimers();
		});

		it("should handle stderr with warnings", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock spawn to return stderr containing 'warning'
			mockSpawn.mockImplementation(() =>
				createMockChildProcess({
					stdout: "Dependencies installed",
					stderr: "warning: package deprecated",
				}),
			);

			const result = await installPluginDependencies("test-plugin", mockLogger);

			expect(result.success).toBe(true);
			expect(mockLogger.error).toHaveBeenCalledWith(
				"Dependency installation warnings for test-plugin: warning: package deprecated",
			);
		});

		it("should construct correct plugin path", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock spawn to succeed
			mockSpawn.mockImplementation(() =>
				createMockChildProcess({
					stdout: "Dependencies installed",
					stderr: "",
				}),
			);

			await installPluginDependencies("my-awesome-plugin", mockLogger);

			expect(vi.mocked(fs.access)).toHaveBeenCalledWith(
				"/test/cwd/src/plugin/available/my-awesome-plugin/package.json",
			);
		});

		it("should handle dynamic import error", async () => {
			// Mock fs.access to succeed but spawn to fail
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock spawn to emit an error
			mockSpawn.mockImplementation(() =>
				createMockChildProcess({ error: new Error("Import failed") }),
			);

			const result = await installPluginDependencies("test-plugin", mockLogger);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Import failed");
		});
	});

	describe("installPluginDependenciesWithErrorHandling", () => {
		it("should complete successfully when dependencies install correctly", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock spawn to succeed
			mockSpawn.mockImplementation(() =>
				createMockChildProcess({
					stdout: "Dependencies installed",
					stderr: "",
				}),
			);

			await expect(
				installPluginDependenciesWithErrorHandling("test-plugin", mockLogger),
			).resolves.toBeUndefined();
		});

		it("should throw TalawaGraphQLError when installation fails", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock spawn to fail with non-zero exit code
			mockSpawn.mockImplementation(() =>
				createMockChildProcess({
					exitCode: 1,
					stderr: "Installation failed",
				}),
			);

			await expect(
				installPluginDependenciesWithErrorHandling("test-plugin", mockLogger),
			).rejects.toThrow(TalawaGraphQLError);

			try {
				await installPluginDependenciesWithErrorHandling(
					"test-plugin",
					mockLogger,
				);
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				const graphqlError = error as TalawaGraphQLError;
				expect(graphqlError.extensions?.code).toBe(
					"forbidden_action_on_arguments_associated_resources",
				);
				const extensions = graphqlError.extensions as {
					issues?: Array<{
						argumentPath?: string[];
						message?: string;
					}>;
				};
				expect(extensions?.issues?.[0]?.argumentPath).toEqual([
					"input",
					"pluginId",
				]);
				expect(extensions?.issues?.[0]?.message).toContain(
					"Failed to install plugin dependencies:",
				);
			}
		});

		it("should handle unknown error in TalawaGraphQLError", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock spawn to fail with error event
			mockSpawn.mockImplementation(() =>
				createMockChildProcess({ error: new Error("Unknown spawn error") }),
			);

			try {
				await installPluginDependenciesWithErrorHandling(
					"test-plugin",
					mockLogger,
				);
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				const graphqlError = error as TalawaGraphQLError;
				const extensions = graphqlError.extensions as {
					issues?: Array<{
						message?: string;
					}>;
				};
				expect(extensions?.issues?.[0]?.message).toBe(
					"Failed to install plugin dependencies: Unknown spawn error",
				);
			}
		});

		it("should work without logger", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock spawn to succeed
			mockSpawn.mockImplementation(() =>
				createMockChildProcess({
					stdout: "Dependencies installed",
					stderr: "",
				}),
			);

			await expect(
				installPluginDependenciesWithErrorHandling("test-plugin"),
			).resolves.toBeUndefined();
		});

		it("should skip installation and complete successfully when no package.json", async () => {
			// Mock fs.access to fail (no package.json)
			vi.mocked(fs.access).mockRejectedValue(new Error("ENOENT"));

			await expect(
				installPluginDependenciesWithErrorHandling("test-plugin", mockLogger),
			).resolves.toBeUndefined();
		});
	});

	describe("Edge cases", () => {
		it("should handle empty plugin ID", async () => {
			const result = await installPluginDependencies("", mockLogger);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid plugin ID");
			expect(mockLogger.error).toHaveBeenCalledWith(
				expect.stringContaining("Plugin ID validation failed"),
			);
		});

		it("should handle plugin ID with special characters", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock spawn to succeed
			mockSpawn.mockImplementation(() =>
				createMockChildProcess({
					stdout: "Dependencies installed",
					stderr: "",
				}),
			);

			const result = await installPluginDependencies(
				"plugin-with-dashes_and_underscores",
				mockLogger,
			);

			expect(result.success).toBe(true);
		});

		it("should handle very long stderr output with warnings", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			const longStderr = "warning: ".repeat(1000);
			// Mock spawn to return long stderr with warnings
			mockSpawn.mockImplementation(() =>
				createMockChildProcess({
					stdout: "Dependencies installed",
					stderr: longStderr,
				}),
			);

			const result = await installPluginDependencies("test-plugin", mockLogger);

			expect(result.success).toBe(true);
			expect(mockLogger.error).toHaveBeenCalledWith(
				`Dependency installation warnings for test-plugin: ${longStderr}`,
			);
		});

		it("should handle spawn error event", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock spawn to emit an error event
			mockSpawn.mockImplementation(() =>
				createMockChildProcess({ error: new Error("Spawn failed") }),
			);

			const result = await installPluginDependencies("test-plugin", mockLogger);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Spawn failed");
		});
	});

	describe("Logger variations", () => {
		it("should handle logger with only info method", async () => {
			const partialLogger = { info: vi.fn() };

			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock spawn to fail with non-zero exit code
			mockSpawn.mockImplementation(() =>
				createMockChildProcess({
					exitCode: 1,
					stderr: "Installation failed",
				}),
			);

			const result = await installPluginDependencies(
				"test-plugin",
				partialLogger,
			);

			expect(result.success).toBe(false);
			expect(partialLogger.info).toHaveBeenCalledWith(
				"Installing dependencies for plugin test-plugin...",
			);
		});

		it("should handle logger with only error method", async () => {
			const partialLogger = { error: vi.fn() };

			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock spawn to fail with non-zero exit code
			mockSpawn.mockImplementation(() =>
				createMockChildProcess({
					exitCode: 1,
					stderr: "Installation failed",
				}),
			);

			const result = await installPluginDependencies(
				"test-plugin",
				partialLogger,
			);

			expect(result.success).toBe(false);
			expect(partialLogger.error).toHaveBeenCalledWith(
				expect.stringContaining(
					"Failed to install dependencies for plugin test-plugin",
				),
			);
		});
	});

	describe("Buffer truncation", () => {
		it("should truncate stdout when exceeding MAX_BUFFER", async () => {
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Create a child that emits data in chunks exceeding the buffer
			const child = new EventEmitter() as EventEmitter & {
				stdout: EventEmitter;
				stderr: EventEmitter;
				pid: number;
				kill: ReturnType<typeof vi.fn>;
				exitCode: number | null;
			};
			child.stdout = new EventEmitter();
			child.stderr = new EventEmitter();
			child.pid = 12345;
			child.kill = vi.fn();
			child.exitCode = null;

			mockSpawn.mockImplementation(() => {
				setImmediate(() => {
					// Emit multiple chunks to exceed 1MB buffer
					const largeChunk = "x".repeat(600000);
					child.stdout.emit("data", Buffer.from(largeChunk));
					child.stdout.emit("data", Buffer.from(largeChunk)); // Should be truncated
					child.exitCode = 0;
					child.emit("close", 0);
				});
				return child;
			});

			const result = await installPluginDependencies("test-plugin", mockLogger);

			expect(result.success).toBe(true);
			// Output should be truncated and show truncation message
			expect(result.output).toContain("[output truncated]");
		});

		it("should truncate stderr when exceeding MAX_BUFFER", async () => {
			vi.mocked(fs.access).mockResolvedValue(undefined);

			const child = new EventEmitter() as EventEmitter & {
				stdout: EventEmitter;
				stderr: EventEmitter;
				pid: number;
				kill: ReturnType<typeof vi.fn>;
				exitCode: number | null;
			};
			child.stdout = new EventEmitter();
			child.stderr = new EventEmitter();
			child.pid = 12345;
			child.kill = vi.fn();
			child.exitCode = null;

			mockSpawn.mockImplementation(() => {
				setImmediate(() => {
					// Emit warning in stderr with chunks exceeding buffer
					const largeChunk = "warning: ".repeat(150000);
					child.stderr.emit("data", Buffer.from(largeChunk));
					child.stderr.emit("data", Buffer.from(largeChunk)); // Should be truncated
					child.stdout.emit("data", Buffer.from("done"));
					child.exitCode = 0;
					child.emit("close", 0);
				});
				return child;
			});

			const result = await installPluginDependencies("test-plugin", mockLogger);

			expect(result.success).toBe(true);
			expect(mockLogger.error).toHaveBeenCalled(); // stderr with warning was logged
		});
	});

	describe("Process handling", () => {
		it("should handle child process without pid", async () => {
			vi.mocked(fs.access).mockResolvedValue(undefined);

			const child = new EventEmitter() as EventEmitter & {
				stdout: EventEmitter;
				stderr: EventEmitter;
				pid: undefined;
				kill: ReturnType<typeof vi.fn>;
				exitCode: number | null;
				unref?: ReturnType<typeof vi.fn>;
			};
			child.stdout = new EventEmitter();
			child.stderr = new EventEmitter();
			child.pid = undefined;
			child.kill = vi.fn();
			child.exitCode = null;
			child.unref = vi.fn();

			mockSpawn.mockImplementation(() => {
				setImmediate(() => {
					child.stdout.emit("data", Buffer.from("done"));
					child.exitCode = 0;
					child.emit("close", 0);
				});
				return child;
			});

			const result = await installPluginDependencies("test-plugin", mockLogger);

			expect(result.success).toBe(true);
		});

		it("should call unref on detached processes on Unix", async () => {
			// Temporarily mock platform to be Unix
			const originalPlatform = process.platform;
			Object.defineProperty(process, "platform", {
				value: "linux",
				writable: true,
			});

			try {
				vi.mocked(fs.access).mockResolvedValue(undefined);

				const child = new EventEmitter() as EventEmitter & {
					stdout: EventEmitter;
					stderr: EventEmitter;
					pid: number;
					kill: ReturnType<typeof vi.fn>;
					exitCode: number | null;
					unref: ReturnType<typeof vi.fn>;
				};
				child.stdout = new EventEmitter();
				child.stderr = new EventEmitter();
				child.pid = 12345;
				child.kill = vi.fn();
				child.exitCode = null;
				child.unref = vi.fn();

				mockSpawn.mockImplementation(() => {
					setImmediate(() => {
						child.stdout.emit("data", Buffer.from("done"));
						child.exitCode = 0;
						child.emit("close", 0);
					});
					return child;
				});

				const result = await installPluginDependencies(
					"test-plugin",
					mockLogger,
				);

				expect(result.success).toBe(true);
				expect(child.unref).toHaveBeenCalled();
			} finally {
				// Restore platform even if assertions throw
				Object.defineProperty(process, "platform", {
					value: originalPlatform,
					writable: true,
				});
			}
		});

		it("should not call unref on Windows", async () => {
			// Temporarily mock platform to be Windows
			const originalPlatform = process.platform;
			Object.defineProperty(process, "platform", {
				value: "win32",
				writable: true,
			});

			try {
				vi.mocked(fs.access).mockResolvedValue(undefined);

				const child = new EventEmitter() as EventEmitter & {
					stdout: EventEmitter;
					stderr: EventEmitter;
					pid: number;
					kill: ReturnType<typeof vi.fn>;
					exitCode: number | null;
					unref: ReturnType<typeof vi.fn>;
				};
				child.stdout = new EventEmitter();
				child.stderr = new EventEmitter();
				child.pid = 12345;
				child.kill = vi.fn();
				child.exitCode = null;
				child.unref = vi.fn();

				mockSpawn.mockImplementation(() => {
					setImmediate(() => {
						child.stdout.emit("data", Buffer.from("done"));
						child.exitCode = 0;
						child.emit("close", 0);
					});
					return child;
				});

				const result = await installPluginDependencies(
					"test-plugin",
					mockLogger,
				);

				expect(result.success).toBe(true);
				// unref should not be called on Windows (isUnix is false)
				expect(child.unref).not.toHaveBeenCalled();
			} finally {
				// Restore platform even if assertions throw
				Object.defineProperty(process, "platform", {
					value: originalPlatform,
					writable: true,
				});
			}
		});
	});

	describe("Error handling edge cases", () => {
		it("should handle non-Error exception types", async () => {
			vi.mocked(fs.access).mockResolvedValue(undefined);

			const child = new EventEmitter() as EventEmitter & {
				stdout: EventEmitter;
				stderr: EventEmitter;
				pid: number;
				kill: ReturnType<typeof vi.fn>;
				exitCode: number | null;
			};
			child.stdout = new EventEmitter();
			child.stderr = new EventEmitter();
			child.pid = 12345;
			child.kill = vi.fn();
			child.exitCode = null;

			mockSpawn.mockImplementation(() => {
				setImmediate(() => {
					// Emit a non-Error object as error
					child.emit("error", "string error");
				});
				return child;
			});

			const result = await installPluginDependencies("test-plugin", mockLogger);

			expect(result.success).toBe(false);
			// Non-Error types should result in "Unknown error"
			expect(result.error).toBe("Unknown error");
		});

		it("should handle close event after settle", async () => {
			vi.mocked(fs.access).mockResolvedValue(undefined);

			const child = new EventEmitter() as EventEmitter & {
				stdout: EventEmitter;
				stderr: EventEmitter;
				pid: number;
				kill: ReturnType<typeof vi.fn>;
				exitCode: number | null;
			};
			child.stdout = new EventEmitter();
			child.stderr = new EventEmitter();
			child.pid = 12345;
			child.kill = vi.fn();
			child.exitCode = null;

			mockSpawn.mockImplementation(() => {
				setImmediate(() => {
					// First emit error (settles the promise)
					child.emit("error", new Error("First error"));
					// Then emit close (should be ignored because already settled)
					child.exitCode = 0;
					child.emit("close", 0);
				});
				return child;
			});

			const result = await installPluginDependencies("test-plugin", mockLogger);

			expect(result.success).toBe(false);
			expect(result.error).toBe("First error");
		});

		it("should handle error event after settle", async () => {
			vi.mocked(fs.access).mockResolvedValue(undefined);

			const child = new EventEmitter() as EventEmitter & {
				stdout: EventEmitter;
				stderr: EventEmitter;
				pid: number;
				kill: ReturnType<typeof vi.fn>;
				exitCode: number | null;
			};
			child.stdout = new EventEmitter();
			child.stderr = new EventEmitter();
			child.pid = 12345;
			child.kill = vi.fn();
			child.exitCode = null;

			mockSpawn.mockImplementation(() => {
				setImmediate(() => {
					// First emit close (settles the promise)
					child.exitCode = 0;
					child.emit("close", 0);
					// Then emit error (should be ignored because already settled)
					child.emit("error", new Error("Late error"));
				});
				return child;
			});

			const result = await installPluginDependencies("test-plugin", mockLogger);

			expect(result.success).toBe(true);
		});
	});

	describe("Plugin ID validation", () => {
		it("should reject plugin ID with path traversal attempts", async () => {
			const result = await installPluginDependencies(
				"../malicious",
				mockLogger,
			);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid plugin ID");
		});

		it("should reject plugin ID with shell metacharacters", async () => {
			const result = await installPluginDependencies(
				"plugin;rm -rf /",
				mockLogger,
			);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid plugin ID");
		});

		it("should reject plugin ID starting with number", async () => {
			const result = await installPluginDependencies("123plugin", mockLogger);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Invalid plugin ID");
		});
	});

	describe("installPluginDependenciesWithErrorHandling edge cases", () => {
		it("should include 'Unknown error' when result.error is undefined", async () => {
			// This tests line 264 where result.error might be falsy
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock to return success: false without an error message
			const child = new EventEmitter() as EventEmitter & {
				stdout: EventEmitter;
				stderr: EventEmitter;
				pid: number;
				kill: ReturnType<typeof vi.fn>;
				exitCode: number | null;
			};
			child.stdout = new EventEmitter();
			child.stderr = new EventEmitter();
			child.pid = 12345;
			child.kill = vi.fn();
			child.exitCode = null;

			mockSpawn.mockImplementation(() => {
				setImmediate(() => {
					// Emit a non-Error object to trigger "Unknown error"
					child.emit("error", null);
				});
				return child;
			});

			try {
				await installPluginDependenciesWithErrorHandling(
					"test-plugin",
					mockLogger,
				);
				expect.fail("Should have thrown");
			} catch (error) {
				expect(error).toBeInstanceOf(TalawaGraphQLError);
				const graphqlError = error as TalawaGraphQLError;
				const extensions = graphqlError.extensions as {
					issues?: Array<{
						message?: string;
					}>;
				};
				expect(extensions?.issues?.[0]?.message).toContain("Unknown error");
			}
		});
	});

	// New tests for killProcessTree coverage
	describe("Kill process tree - Windows", () => {
		let originalPlatform: NodeJS.Platform;

		beforeEach(() => {
			originalPlatform = process.platform;
			// Mock platform to be Windows
			Object.defineProperty(process, "platform", {
				value: "win32",
				writable: true,
				configurable: true,
			});
		});

		afterEach(() => {
			// Restore to original platform
			Object.defineProperty(process, "platform", {
				value: originalPlatform,
				writable: true,
				configurable: true,
			});
		});

		it("should spawn taskkill on Windows when timeout occurs", async () => {
			vi.useFakeTimers();
			vi.mocked(fs.access).mockResolvedValue(undefined);

			const child = new EventEmitter() as EventEmitter & {
				stdout: EventEmitter;
				stderr: EventEmitter;
				pid: number;
				kill: ReturnType<typeof vi.fn>;
				exitCode: number | null;
			};
			child.stdout = new EventEmitter();
			child.stderr = new EventEmitter();
			child.pid = 12345;
			child.kill = vi.fn();
			child.exitCode = null;

			// Track taskkill spawns
			const taskkillChild = new EventEmitter() as EventEmitter & {
				unref?: ReturnType<typeof vi.fn>;
			};
			taskkillChild.unref = vi.fn();

			let firstCall = true;
			mockSpawn.mockImplementation((cmd, _args) => {
				if (firstCall && cmd.includes("pnpm")) {
					firstCall = false;
					// Don't emit close - simulate hanging
					return child;
				}
				if (cmd === "taskkill") {
					// taskkill spawned successfully, emit success
					setImmediate(() => {
						taskkillChild.emit("exit", 0);
					});
					return taskkillChild;
				}
				return child;
			});

			const resultPromise = installPluginDependencies(
				"test-plugin",
				mockLogger,
			);

			// Trigger timeout
			await vi.advanceTimersByTimeAsync(300000);

			const result = await resultPromise;

			expect(result.success).toBe(false);
			expect(result.error).toBe("Installation timed out after 5 minutes");

			// Verify taskkill was spawned
			expect(mockSpawn).toHaveBeenCalledWith(
				"taskkill",
				["/PID", "12345", "/T", "/F"],
				{ stdio: "ignore" },
			);

			vi.useRealTimers();
		});

		it("should fallback to child.kill when taskkill spawn fails", async () => {
			vi.useFakeTimers();
			vi.mocked(fs.access).mockResolvedValue(undefined);

			const child = new EventEmitter() as EventEmitter & {
				stdout: EventEmitter;
				stderr: EventEmitter;
				pid: number;
				kill: ReturnType<typeof vi.fn>;
				exitCode: number | null;
			};
			child.stdout = new EventEmitter();
			child.stderr = new EventEmitter();
			child.pid = 12345;
			child.kill = vi.fn();
			child.exitCode = null;

			let taskkillSpawned = false;
			const taskkillChild = new EventEmitter() as EventEmitter & {
				unref?: ReturnType<typeof vi.fn>;
			};
			taskkillChild.unref = vi.fn();

			let firstCall = true;
			mockSpawn.mockImplementation((cmd) => {
				if (firstCall && cmd.includes("pnpm")) {
					firstCall = false;
					return child;
				}
				if (cmd === "taskkill") {
					taskkillSpawned = true;
					return taskkillChild;
				}
				return child;
			});

			const resultPromise = installPluginDependencies(
				"test-plugin",
				mockLogger,
			);

			// Advance to trigger timeout and taskkill spawn
			await vi.advanceTimersByTimeAsync(300000);

			// Verify taskkill was spawned, then emit error
			expect(taskkillSpawned).toBe(true);
			taskkillChild.emit("error", new Error("ENOENT"));
			// Allow promises to settle
			await Promise.resolve();

			const result = await resultPromise;

			expect(result.success).toBe(false);
			// Verify child.kill was called as fallback
			expect(child.kill).toHaveBeenCalledWith("SIGTERM");

			vi.useRealTimers();
		});

		it("should fallback to child.kill when taskkill exits with non-zero code", async () => {
			vi.useFakeTimers();
			vi.mocked(fs.access).mockResolvedValue(undefined);

			const child = new EventEmitter() as EventEmitter & {
				stdout: EventEmitter;
				stderr: EventEmitter;
				pid: number;
				kill: ReturnType<typeof vi.fn>;
				exitCode: number | null;
			};
			child.stdout = new EventEmitter();
			child.stderr = new EventEmitter();
			child.pid = 12345;
			child.kill = vi.fn();
			child.exitCode = null;

			let taskkillSpawned = false;
			const taskkillChild = new EventEmitter() as EventEmitter & {
				unref?: ReturnType<typeof vi.fn>;
			};
			taskkillChild.unref = vi.fn();

			let firstCall = true;
			mockSpawn.mockImplementation((cmd) => {
				if (firstCall && cmd.includes("pnpm")) {
					firstCall = false;
					return child;
				}
				if (cmd === "taskkill") {
					taskkillSpawned = true;
					return taskkillChild;
				}
				return child;
			});

			const resultPromise = installPluginDependencies(
				"test-plugin",
				mockLogger,
			);

			// Advance to trigger timeout and taskkill spawn
			await vi.advanceTimersByTimeAsync(300000);

			// Now emit the taskkill exit synchronously
			if (taskkillSpawned) {
				taskkillChild.emit("exit", 1);
			}

			// Allow promises to settle
			await Promise.resolve();

			const result = await resultPromise;

			expect(result.success).toBe(false);
			// Verify child.kill was called as fallback
			expect(child.kill).toHaveBeenCalledWith("SIGTERM");

			vi.useRealTimers();
		});

		it("should handle taskkill unref being undefined", async () => {
			vi.useFakeTimers();
			vi.mocked(fs.access).mockResolvedValue(undefined);

			const child = new EventEmitter() as EventEmitter & {
				stdout: EventEmitter;
				stderr: EventEmitter;
				pid: number;
				kill: ReturnType<typeof vi.fn>;
				exitCode: number | null;
			};
			child.stdout = new EventEmitter();
			child.stderr = new EventEmitter();
			child.pid = 12345;
			child.kill = vi.fn();
			child.exitCode = null;

			const taskkillChild = new EventEmitter();

			let firstCall = true;
			mockSpawn.mockImplementation((cmd) => {
				if (firstCall && cmd.includes("pnpm")) {
					firstCall = false;
					return child;
				}
				if (cmd === "taskkill") {
					setImmediate(() => {
						taskkillChild.emit("exit", 0);
					});
					return taskkillChild;
				}
				return child;
			});

			const resultPromise = installPluginDependencies(
				"test-plugin",
				mockLogger,
			);

			await vi.advanceTimersByTimeAsync(300000);

			const result = await resultPromise;

			expect(result.success).toBe(false);

			vi.useRealTimers();
		});

		it("should handle child.kill throwing when taskkill error handler calls it", async () => {
			vi.useFakeTimers();
			vi.mocked(fs.access).mockResolvedValue(undefined);

			const child = new EventEmitter() as EventEmitter & {
				stdout: EventEmitter;
				stderr: EventEmitter;
				pid: number;
				kill: ReturnType<typeof vi.fn>;
				exitCode: number | null;
			};
			child.stdout = new EventEmitter();
			child.stderr = new EventEmitter();
			child.pid = 12345;
			// Make child.kill throw an error
			child.kill = vi.fn().mockImplementation(() => {
				throw new Error("Process already terminated");
			});
			child.exitCode = null;

			let taskkillSpawned = false;
			const taskkillChild = new EventEmitter() as EventEmitter & {
				unref?: ReturnType<typeof vi.fn>;
			};
			taskkillChild.unref = vi.fn();

			let firstCall = true;
			mockSpawn.mockImplementation((cmd) => {
				if (firstCall && cmd.includes("pnpm")) {
					firstCall = false;
					return child;
				}
				if (cmd === "taskkill") {
					taskkillSpawned = true;
					return taskkillChild;
				}
				return child;
			});

			const resultPromise = installPluginDependencies(
				"test-plugin",
				mockLogger,
			);

			await vi.advanceTimersByTimeAsync(300000);

			// Emit taskkill error to trigger the fallback that will throw
			if (taskkillSpawned) {
				taskkillChild.emit("error", new Error("ENOENT"));
			}

			await Promise.resolve();

			const result = await resultPromise;

			expect(result.success).toBe(false);
			// Verify child.kill was called even though it threw
			expect(child.kill).toHaveBeenCalledWith("SIGTERM");

			vi.useRealTimers();
		});

		it("should handle child.kill throwing when taskkill exit handler calls it", async () => {
			vi.useFakeTimers();
			vi.mocked(fs.access).mockResolvedValue(undefined);

			const child = new EventEmitter() as EventEmitter & {
				stdout: EventEmitter;
				stderr: EventEmitter;
				pid: number;
				kill: ReturnType<typeof vi.fn>;
				exitCode: number | null;
			};
			child.stdout = new EventEmitter();
			child.stderr = new EventEmitter();
			child.pid = 12345;
			// Make child.kill throw an error
			child.kill = vi.fn().mockImplementation(() => {
				throw new Error("Process already terminated");
			});
			child.exitCode = null;

			let taskkillSpawned = false;
			const taskkillChild = new EventEmitter() as EventEmitter & {
				unref?: ReturnType<typeof vi.fn>;
			};
			taskkillChild.unref = vi.fn();

			let firstCall = true;
			mockSpawn.mockImplementation((cmd) => {
				if (firstCall && cmd.includes("pnpm")) {
					firstCall = false;
					return child;
				}
				if (cmd === "taskkill") {
					taskkillSpawned = true;
					return taskkillChild;
				}
				return child;
			});

			const resultPromise = installPluginDependencies(
				"test-plugin",
				mockLogger,
			);

			await vi.advanceTimersByTimeAsync(300000);

			// Emit taskkill exit with non-zero to trigger the fallback that will throw
			if (taskkillSpawned) {
				taskkillChild.emit("exit", 1);
			}

			await Promise.resolve();

			const result = await resultPromise;

			expect(result.success).toBe(false);
			// Verify child.kill was called even though it threw
			expect(child.kill).toHaveBeenCalledWith("SIGTERM");

			vi.useRealTimers();
		});
	});

	describe("Kill process tree - Unix", () => {
		let originalPlatform: NodeJS.Platform;

		beforeEach(() => {
			originalPlatform = process.platform;
			// Mock platform to be Unix
			Object.defineProperty(process, "platform", {
				value: "linux",
				writable: true,
				configurable: true,
			});
			// Mock process.kill
			process.kill = mockProcessKill as typeof process.kill;
		});

		afterEach(() => {
			// Restore original process.kill
			process.kill = originalProcessKill as typeof process.kill;
			// Restore platform
			Object.defineProperty(process, "platform", {
				value: originalPlatform,
				writable: true,
				configurable: true,
			});
		});

		it("should kill process group on Unix when timeout occurs", async () => {
			vi.useFakeTimers();
			vi.mocked(fs.access).mockResolvedValue(undefined);

			const child = new EventEmitter() as EventEmitter & {
				stdout: EventEmitter;
				stderr: EventEmitter;
				pid: number;
				kill: ReturnType<typeof vi.fn>;
				exitCode: number | null;
			};
			child.stdout = new EventEmitter();
			child.stderr = new EventEmitter();
			child.pid = 12345;
			child.kill = vi.fn();
			child.exitCode = null;

			mockSpawn.mockImplementation(() => {
				// Don't emit close - simulate hanging
				return child;
			});

			mockProcessKill.mockImplementation(() => {
				// Simulate successful kill
			});

			const resultPromise = installPluginDependencies(
				"test-plugin",
				mockLogger,
			);

			// Trigger timeout
			await vi.advanceTimersByTimeAsync(300000);

			const result = await resultPromise;

			expect(result.success).toBe(false);
			expect(result.error).toBe("Installation timed out after 5 minutes");

			// Verify process.kill was called with negative PID (process group)
			expect(mockProcessKill).toHaveBeenCalledWith(-12345, "SIGTERM");

			vi.useRealTimers();
		});

		it("should fallback to child.kill when process.kill fails on Unix", async () => {
			vi.useFakeTimers();
			vi.mocked(fs.access).mockResolvedValue(undefined);

			const child = new EventEmitter() as EventEmitter & {
				stdout: EventEmitter;
				stderr: EventEmitter;
				pid: number;
				kill: ReturnType<typeof vi.fn>;
				exitCode: number | null;
			};
			child.stdout = new EventEmitter();
			child.stderr = new EventEmitter();
			child.pid = 12345;
			child.kill = vi.fn();
			child.exitCode = null;

			mockSpawn.mockImplementation(() => child);

			// Mock process.kill to throw error
			mockProcessKill.mockImplementation(() => {
				throw new Error("ESRCH");
			});

			const resultPromise = installPluginDependencies(
				"test-plugin",
				mockLogger,
			);

			await vi.advanceTimersByTimeAsync(300000);

			const result = await resultPromise;

			expect(result.success).toBe(false);
			// Verify child.kill was called as fallback
			expect(child.kill).toHaveBeenCalledWith("SIGTERM");

			vi.useRealTimers();
		});

		it("should handle SIGKILL after SIGTERM if process still running", async () => {
			vi.useFakeTimers();
			vi.mocked(fs.access).mockResolvedValue(undefined);

			const child = new EventEmitter() as EventEmitter & {
				stdout: EventEmitter;
				stderr: EventEmitter;
				pid: number;
				kill: ReturnType<typeof vi.fn>;
				exitCode: number | null;
			};
			child.stdout = new EventEmitter();
			child.stderr = new EventEmitter();
			child.pid = 12345;
			child.kill = vi.fn();
			child.exitCode = null;

			mockSpawn.mockImplementation(() => child);
			mockProcessKill.mockImplementation(() => {});

			const resultPromise = installPluginDependencies(
				"test-plugin",
				mockLogger,
			);

			// Trigger initial timeout (5 minutes)
			await vi.advanceTimersByTimeAsync(300000);

			// Trigger force kill timeout (5 seconds after SIGTERM)
			await vi.advanceTimersByTimeAsync(5000);

			const result = await resultPromise;

			expect(result.success).toBe(false);

			// Verify both SIGTERM and SIGKILL were called
			expect(mockProcessKill).toHaveBeenCalledWith(-12345, "SIGTERM");
			expect(mockProcessKill).toHaveBeenCalledWith(-12345, "SIGKILL");

			vi.useRealTimers();
		});

		it("should not call SIGKILL if process already exited", async () => {
			vi.useFakeTimers();
			vi.mocked(fs.access).mockResolvedValue(undefined);

			const child = new EventEmitter() as EventEmitter & {
				stdout: EventEmitter;
				stderr: EventEmitter;
				pid: number;
				kill: ReturnType<typeof vi.fn>;
				exitCode: number | null;
			};
			child.stdout = new EventEmitter();
			child.stderr = new EventEmitter();
			child.pid = 12345;
			child.kill = vi.fn();
			child.exitCode = null;

			mockSpawn.mockImplementation(() => child);
			mockProcessKill.mockImplementation(() => {
				// Simulate process exiting after SIGTERM
				child.exitCode = 143; // SIGTERM exit code
			});

			const resultPromise = installPluginDependencies(
				"test-plugin",
				mockLogger,
			);

			// Trigger initial timeout
			await vi.advanceTimersByTimeAsync(300000);

			// Trigger force kill timeout
			await vi.advanceTimersByTimeAsync(5000);

			const result = await resultPromise;

			expect(result.success).toBe(false);

			// Verify SIGTERM was called
			expect(mockProcessKill).toHaveBeenCalledWith(-12345, "SIGTERM");

			// Verify SIGKILL was NOT called (because exitCode is NOT null)
			expect(mockProcessKill).not.toHaveBeenCalledWith(-12345, "SIGKILL");

			vi.useRealTimers();
		});

		it("should skip killProcessTree when pid is null", async () => {
			vi.useFakeTimers();
			vi.mocked(fs.access).mockResolvedValue(undefined);

			const child = new EventEmitter() as EventEmitter & {
				stdout: EventEmitter;
				stderr: EventEmitter;
				pid: undefined;
				kill: ReturnType<typeof vi.fn>;
				exitCode: number | null;
			};
			child.stdout = new EventEmitter();
			child.stderr = new EventEmitter();
			child.pid = undefined;
			child.kill = vi.fn();
			child.exitCode = null;

			mockSpawn.mockImplementation(() => child);

			const resultPromise = installPluginDependencies(
				"test-plugin",
				mockLogger,
			);

			await vi.advanceTimersByTimeAsync(300000);

			const result = await resultPromise;

			expect(result.success).toBe(false);

			// Verify process.kill was NOT called (pid was undefined)
			expect(mockProcessKill).not.toHaveBeenCalled();

			vi.useRealTimers();
		});

		it("should handle both process.kill and child.kill throwing errors", async () => {
			vi.useFakeTimers();
			vi.mocked(fs.access).mockResolvedValue(undefined);

			const child = new EventEmitter() as EventEmitter & {
				stdout: EventEmitter;
				stderr: EventEmitter;
				pid: number;
				kill: ReturnType<typeof vi.fn>;
				exitCode: number | null;
			};
			child.stdout = new EventEmitter();
			child.stderr = new EventEmitter();
			child.pid = 12345;
			// Make child.kill also throw
			child.kill = vi.fn().mockImplementation(() => {
				throw new Error("Child process gone");
			});
			child.exitCode = null;

			mockSpawn.mockImplementation(() => child);

			// Mock process.kill to throw error (fallback scenario)
			mockProcessKill.mockImplementation(() => {
				throw new Error("ESRCH - No such process");
			});

			const resultPromise = installPluginDependencies(
				"test-plugin",
				mockLogger,
			);

			await vi.advanceTimersByTimeAsync(300000);

			const result = await resultPromise;

			expect(result.success).toBe(false);
			// Verify both were called and both threw
			expect(mockProcessKill).toHaveBeenCalledWith(-12345, "SIGTERM");
			expect(child.kill).toHaveBeenCalledWith("SIGTERM");

			vi.useRealTimers();
		});
	});
});
