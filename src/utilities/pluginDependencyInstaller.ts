/**
 * Plugin Dependency Installer Utility
 *
 * Handles installation of plugin dependencies using pnpm before plugin installation.
 * This ensures that all required dependencies are available before database creation.
 */

import path from "node:path";
import { TalawaGraphQLError } from "./TalawaGraphQLError";
import { pluginIdSchema } from "./validators";

const MAX_BUFFER = 1_000_000; // 1MB

export interface DependencyInstallationResult {
	success: boolean;
	error?: string;
	output?: string;
}

/**
 * Install dependencies for a plugin using pnpm
 * @param pluginId - The ID of the plugin
 * @param logger - Optional logger for output
 * @returns Promise<DependencyInstallationResult>
 */
export async function installPluginDependencies(
	pluginId: string,
	logger?: {
		info?: (message: string) => void;
		error?: (message: string) => void;
	},
): Promise<DependencyInstallationResult> {
	// Validate pluginId to prevent command injection
	const validation = pluginIdSchema.safeParse(pluginId);
	if (!validation.success) {
		logger?.error?.(
			`Plugin ID validation failed: ${JSON.stringify(validation.error.flatten())}`,
		);
		return {
			success: false,
			error: "Invalid plugin ID",
		};
	}

	const pluginPath = path.join(
		process.cwd(),
		"src",
		"plugin",
		"available",
		pluginId,
	);

	const packageJsonPath = path.join(pluginPath, "package.json");

	try {
		// Check if package.json exists
		const fs = await import("node:fs/promises");
		try {
			await fs.access(packageJsonPath);
		} catch {
			// No package.json found, skip dependency installation
			logger?.info?.(
				`No package.json found for plugin ${pluginId}, skipping dependency installation`,
			);
			return { success: true };
		}

		logger?.info?.(`Installing dependencies for plugin ${pluginId}...`);

		// Use spawn with args array to avoid shell injection
		const { spawn } = await import("node:child_process");
		const pnpmBin = process.platform === "win32" ? "pnpm.cmd" : "pnpm";

		const installResult = await new Promise<{
			stdout: string;
			stderr: string;
		}>((resolve, reject) => {
			const child = spawn(pnpmBin, ["install", "--frozen-lockfile"], {
				cwd: pluginPath,
			});

			let stdout = "";
			let stderr = "";
			let settled = false;

			child.stdout?.on("data", (data) => {
				if (stdout.length < MAX_BUFFER) stdout += data.toString();
			});

			child.stderr?.on("data", (data) => {
				if (stderr.length < MAX_BUFFER) stderr += data.toString();
			});

			// Set timeout
			const timeout = setTimeout(() => {
				if (settled) return;
				settled = true;
				child.kill("SIGTERM");
				const forceKill = setTimeout(() => {
					if (child.exitCode === null && typeof child.kill === "function") {
						try {
							child.kill("SIGKILL");
						} catch {
							// Ignore errors if process is already gone
						}
					}
				}, 5000);
				if (forceKill.unref) forceKill.unref();
				reject(new Error("Installation timed out after 5 minutes"));
			}, 300000); // 5 minutes

			child.once("close", (code) => {
				if (settled) return;
				settled = true;
				clearTimeout(timeout);
				if (code === 0) {
					resolve({ stdout, stderr });
				} else {
					reject(new Error(`pnpm install failed with exit code ${code}`));
				}
			});

			child.once("error", (err) => {
				if (settled) return;
				settled = true;
				clearTimeout(timeout);
				reject(err);
			});
		});

		const lowerStderr = installResult.stderr.toLowerCase();
		if (
			installResult.stderr &&
			(lowerStderr.includes("warn") || lowerStderr.includes("warning"))
		) {
			logger?.error?.(
				`Dependency installation warnings for ${pluginId}: ${installResult.stderr}`,
			);
		}
		logger?.info?.(
			`Successfully installed dependencies for plugin ${pluginId}`,
		);
		return {
			success: true,
			output:
				installResult.stdout.length >= MAX_BUFFER
					? `${installResult.stdout}
[output truncated]`
					: installResult.stdout,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		logger?.error?.(
			`Failed to install dependencies for plugin ${pluginId}: ${errorMessage}`,
		);

		return {
			success: false,
			error: errorMessage,
		};
	}
}

/**
 * Install dependencies for a plugin with error handling that throws TalawaGraphQLError
 * @param pluginId - The ID of the plugin
 * @param logger - Optional logger for output
 * @throws TalawaGraphQLError if installation fails
 */
export async function installPluginDependenciesWithErrorHandling(
	pluginId: string,
	logger?: {
		info?: (message: string) => void;
		error?: (message: string) => void;
	},
): Promise<void> {
	const result = await installPluginDependencies(pluginId, logger);

	if (!result.success) {
		throw new TalawaGraphQLError({
			extensions: {
				code: "forbidden_action_on_arguments_associated_resources",
				issues: [
					{
						argumentPath: ["input", "pluginId"],
						message: `Failed to install plugin dependencies: ${result.error || "Unknown error"}`,
					},
				],
			},
		});
	}
}
