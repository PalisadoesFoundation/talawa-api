/**
 * Plugin Dependency Installer Utility
 *
 * Handles installation of plugin dependencies using pnpm before plugin installation.
 * This ensures that all required dependencies are available before database creation.
 */

import { exec } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";
import { TalawaGraphQLError } from "./TalawaGraphQLError";
import { pluginIdSchema } from "./validators";

const execAsync = promisify(exec);

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

		// Change to plugin directory and run pnpm install
		const command = `cd "${pluginPath}" && pnpm install --frozen-lockfile`;

		const { stdout, stderr } = await execAsync(command, {
			cwd: pluginPath,
			timeout: 300000, // 5 minutes timeout
		});

		if (stderr && !stderr.includes("warning")) {
			logger?.error?.(
				`Dependency installation warnings for ${pluginId}: ${stderr}`,
			);
		}

		logger?.info?.(
			`Successfully installed dependencies for plugin ${pluginId}`,
		);
		return {
			success: true,
			output: stdout,
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
