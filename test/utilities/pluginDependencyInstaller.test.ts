import { beforeEach, describe, expect, it, vi } from "vitest";
import { TalawaGraphQLError } from "../../src/utilities/TalawaGraphQLError";
import {
	installPluginDependencies,
	installPluginDependenciesWithErrorHandling,
} from "../../src/utilities/pluginDependencyInstaller";

// Create hoisted mocks
const mockExecAsync = vi.hoisted(() =>
	vi.fn().mockResolvedValue({ stdout: "Dependencies installed", stderr: "" }),
);

// Mock child_process
vi.mock("node:child_process", () => ({
	exec: vi.fn(),
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

// Mock util
vi.mock("node:util", () => ({
	promisify: vi.fn(() => mockExecAsync),
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
		// Reset mockExecAsync mock to default successful state
		mockExecAsync.mockReset().mockResolvedValue({
			stdout: "Dependencies installed",
			stderr: "",
		});
	});

	describe("installPluginDependencies", () => {
		it("should install dependencies successfully", async () => {
			// Mock fs.access to succeed (package.json exists)
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock mockExecAsync to succeed
			mockExecAsync.mockResolvedValue({
				stdout: "Dependencies installed",
				stderr: "",
			});

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

			// Mock execAsync to return errors (not warnings) in stderr
			mockExecAsync.mockResolvedValue({
				stdout: "Dependencies installed",
				stderr: "error: deprecated package",
			});

			const result = await installPluginDependencies("test-plugin", mockLogger);

			expect(result.success).toBe(true);
			expect(mockLogger.error).toHaveBeenCalledWith(
				"Dependency installation warnings for test-plugin: error: deprecated package",
			);
		});

		it("should ignore warnings in stderr", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock mockExecAsync to return only warnings in stderr
			mockExecAsync.mockResolvedValue({
				stdout: "Dependencies installed",
				stderr: "warning only",
			});

			const result = await installPluginDependencies("test-plugin", mockLogger);

			expect(result.success).toBe(true);
			expect(mockLogger.error).not.toHaveBeenCalled();
		});

		it("should handle exec errors", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock mockExecAsync to fail
			mockExecAsync.mockRejectedValue(new Error("pnpm install failed"));

			const result = await installPluginDependencies("test-plugin", mockLogger);

			expect(result.success).toBe(false);
			expect(result.error).toBe("pnpm install failed");
			expect(mockLogger.error).toHaveBeenCalledWith(
				"Failed to install dependencies for plugin test-plugin: pnpm install failed",
			);
		});

		it("should handle unknown error types", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock mockExecAsync to throw a non-Error object
			mockExecAsync.mockRejectedValue("string error");

			const result = await installPluginDependencies("test-plugin", mockLogger);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Unknown error");
			expect(mockLogger.error).toHaveBeenCalledWith(
				"Failed to install dependencies for plugin test-plugin: Unknown error",
			);
		});

		it("should work without logger", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock mockExecAsync to succeed
			mockExecAsync.mockResolvedValue({
				stdout: "Dependencies installed",
				stderr: "",
			});

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

			// Mock mockExecAsync to succeed
			mockExecAsync.mockResolvedValue({
				stdout: "Dependencies installed",
				stderr: "",
			});

			await installPluginDependencies("test-plugin", mockLogger);

			// Verify mockExecAsync was called with correct parameters
			expect(mockExecAsync).toHaveBeenCalledWith(
				'cd "/test/cwd/src/plugin/available/test-plugin" && pnpm install --frozen-lockfile',
				{
					cwd: "/test/cwd/src/plugin/available/test-plugin",
					timeout: 300000,
				},
			);
		});

		it("should handle timeout errors", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock mockExecAsync to timeout
			const timeoutError = new Error("Command timed out");
			timeoutError.name = "TimeoutError";
			mockExecAsync.mockRejectedValue(timeoutError);

			const result = await installPluginDependencies("test-plugin", mockLogger);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Command timed out");
		});

		it("should handle stderr errors that are not warnings", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock mockExecAsync to return errors in stderr
			mockExecAsync.mockResolvedValue({
				stdout: "Dependencies installed",
				stderr: "error: package not found",
			});

			const result = await installPluginDependencies("test-plugin", mockLogger);

			expect(result.success).toBe(true);
			expect(mockLogger.error).toHaveBeenCalledWith(
				"Dependency installation warnings for test-plugin: error: package not found",
			);
		});

		it("should construct correct plugin path", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock mockExecAsync to succeed
			mockExecAsync.mockResolvedValue({
				stdout: "Dependencies installed",
				stderr: "",
			});

			await installPluginDependencies("my-awesome-plugin", mockLogger);

			expect(vi.mocked(fs.access)).toHaveBeenCalledWith(
				"/test/cwd/src/plugin/available/my-awesome-plugin/package.json",
			);
		});

		it("should handle dynamic import error", async () => {
			// Mock fs.access to succeed but fs import to fail
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock the fs import to fail by making execAsync throw
			mockExecAsync.mockRejectedValue(new Error("Import failed"));

			const result = await installPluginDependencies("test-plugin", mockLogger);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Import failed");
		});
	});

	describe("installPluginDependenciesWithErrorHandling", () => {
		it("should complete successfully when dependencies install correctly", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock mockExecAsync to succeed
			mockExecAsync.mockResolvedValue({
				stdout: "Dependencies installed",
				stderr: "",
			});

			await expect(
				installPluginDependenciesWithErrorHandling("test-plugin", mockLogger),
			).resolves.toBeUndefined();
		});

		it("should throw TalawaGraphQLError when installation fails", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock execAsync to fail
			mockExecAsync.mockRejectedValue(new Error("Installation failed"));

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
				expect(extensions?.issues?.[0]?.message).toBe(
					"Failed to install plugin dependencies: Installation failed",
				);
			}
		});

		it("should handle unknown error in TalawaGraphQLError", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock mockExecAsync to fail with unknown error
			mockExecAsync.mockRejectedValue("string error");

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
					"Failed to install plugin dependencies: Unknown error",
				);
			}
		});

		it("should work without logger", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock mockExecAsync to succeed
			mockExecAsync.mockResolvedValue({
				stdout: "Dependencies installed",
				stderr: "",
			});

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
			// Mock fs.access to fail
			vi.mocked(fs.access).mockRejectedValue(new Error("ENOENT"));

			const result = await installPluginDependencies("", mockLogger);

			expect(result.success).toBe(true);
			expect(mockLogger.info).toHaveBeenCalledWith(
				"No package.json found for plugin , skipping dependency installation",
			);
		});

		it("should handle plugin ID with special characters", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock mockExecAsync to succeed
			mockExecAsync.mockResolvedValue({
				stdout: "Dependencies installed",
				stderr: "",
			});

			const result = await installPluginDependencies(
				"plugin-with-dashes_and_underscores",
				mockLogger,
			);

			expect(result.success).toBe(true);
		});

		it("should handle very long stderr output", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			const longStderr = "error: ".repeat(1000);
			// Mock mockExecAsync to return long stderr
			mockExecAsync.mockResolvedValue({
				stdout: "Dependencies installed",
				stderr: longStderr,
			});

			const result = await installPluginDependencies("test-plugin", mockLogger);

			expect(result.success).toBe(true);
			expect(mockLogger.error).toHaveBeenCalledWith(
				`Dependency installation warnings for test-plugin: ${longStderr}`,
			);
		});

		it("should handle exec callback called without parameters", async () => {
			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock execAsync to throw a non-Error object
			mockExecAsync.mockRejectedValue("string error");

			const result = await installPluginDependencies("test-plugin", mockLogger);

			expect(result.success).toBe(false);
			expect(result.error).toBe("Unknown error");
		});
	});

	describe("Logger variations", () => {
		it("should handle logger with only info method", async () => {
			const partialLogger = { info: vi.fn() };

			// Mock fs.access to succeed
			vi.mocked(fs.access).mockResolvedValue(undefined);

			// Mock mockExecAsync to fail
			mockExecAsync.mockRejectedValue(new Error("Installation failed"));

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

			// Mock mockExecAsync to fail
			mockExecAsync.mockRejectedValue(new Error("Installation failed"));

			const result = await installPluginDependencies(
				"test-plugin",
				partialLogger,
			);

			expect(result.success).toBe(false);
			expect(partialLogger.error).toHaveBeenCalledWith(
				"Failed to install dependencies for plugin test-plugin: Installation failed",
			);
		});
	});
});
