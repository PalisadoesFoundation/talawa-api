/**
 * Plugin Dependency Installer Utility
 *
 * Handles installation of plugin dependencies using pnpm before plugin installation.
 * This ensures that all required dependencies are available before database creation.
 */

import path from "node:path";
import { TalawaGraphQLError } from "./TalawaGraphQLError";
import { pluginIdSchema } from "./validators";

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
		return {
			success: false,
			error: `Invalid plugin ID: ${validation.error.message}`,
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

		const installResult = await new Promise<{
			stdout: string;
			stderr: string;
		}>((resolve, reject) => {
			const child = spawn("pnpm", ["install", "--frozen-lockfile"], {
				cwd: pluginPath,
			});

			let stdout = "";
			let stderr = "";

			child.stdout?.on("data", (data) => {
				stdout += data.toString();
			});

			child.stderr?.on("data", (data) => {
				stderr += data.toString();
			});

			// Set timeout
			const timeout = setTimeout(() => {
				child.kill();
				reject(new Error("Installation timed out after 5 minutes"));
			}, 300000); // 5 minutes

			child.on("close", (code) => {
				clearTimeout(timeout);
				if (code === 0) {
					resolve({ stdout, stderr });
				} else {
					reject(new Error(`pnpm install failed with exit code ${code}`));
				}
			});

			child.on("error", (err) => {
				clearTimeout(timeout);
				reject(err);
			});
		});

		if (installResult.stderr && !installResult.stderr.includes("warning")) {
			logger?.error?.(
				`Dependency installation warnings for ${pluginId}: ${installResult.stderr}`,
			);
		}

		logger?.info?.(
			`Successfully installed dependencies for plugin ${pluginId}`,
		);
		return {
			success: true,
			output: installResult.stdout,
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
