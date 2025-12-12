import { EventEmitter } from "node:events";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TalawaGraphQLError } from "../../src/utilities/TalawaGraphQLError";
import {
	installPluginDependencies,
	installPluginDependenciesWithErrorHandling,
} from "../../src/utilities/pluginDependencyInstaller";

// Create hoisted mock for spawn that returns a mock child process
const mockSpawn = vi.hoisted(() => {
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
	};
	child.stdout = new EventEmitter();
	child.stderr = new EventEmitter();
	child.pid = 12345;
	child.kill = vi.fn();

	// Schedule events to emit after the spawn call
	setImmediate(() => {
		if (stdout) child.stdout.emit("data", Buffer.from(stdout));
		if (stderr) child.stderr.emit("data", Buffer.from(stderr));
		if (error) {
			child.emit("error", error);
		} else {
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

import * as fs from "node:fs/promises";

describe("Plugin Dependency Installer", () => {
	const mockLogger = {
		info: vi.fn(),
		error: vi.fn(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
		// Reset the mock to return the test path
		(process.cwd as ReturnType<typeof vi.fn>).mockReturnValue("/test/cwd");
		// Reset mockSpawn to default successful state
		mockSpawn.mockReset();
		mockSpawn.mockImplementation(() =>
			createMockChildProcess({ stdout: "Dependencies installed", stderr: "" }),
		);
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
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock spawn to emit timeout error
			mockSpawn.mockImplementation(() =>
				createMockChildProcess({
					error: Object.assign(new Error("Command timed out"), {
						name: "TimeoutError",
					}),
				}),
			);

			const result = await installPluginDependencies("test-plugin", mockLogger);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Command timed out");
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
});
