/**
 * Plugin Registry and Initialization Utilities for Talawa API
 *
 * This file provides utilities for initializing the plugin system
 * and creating the plugin context required by the plugin manager.
 */

import { rootLogger } from "~/src/utilities/logging/logger";
import PluginManager from "./manager";
import type { ILogger, IPluginContext } from "./types";

// Global plugin manager instance
let pluginManagerInstance: PluginManager | null = null;

/**
 * Creates a plugin context object with all necessary dependencies
 */
export function createPluginContext(dependencies: {
	db: unknown;
	graphql: unknown;
	pubsub: unknown;
	logger: ILogger;
}): IPluginContext {
	return {
		db: dependencies.db,
		graphql: dependencies.graphql,
		pubsub: dependencies.pubsub,
		logger: dependencies.logger,
	};
}

/**
 * Initializes the plugin system with the provided context
 */
export async function initializePluginSystem(
	context: IPluginContext,
	pluginsDirectory?: string,
): Promise<PluginManager> {
	if (pluginManagerInstance) {
		return pluginManagerInstance;
	}

	try {
		context.logger?.info?.("Initializing plugin system...");

		pluginManagerInstance = new PluginManager(context, pluginsDirectory);

		// Wait for initialization to complete
		await new Promise<void>((resolve) => {
			pluginManagerInstance?.once("plugins:ready", () => {
				resolve();
			});
		});

		context.logger?.info?.("Plugin system initialized successfully");
		return pluginManagerInstance;
	} catch (error) {
		context.logger?.error?.("Failed to initialize plugin system:", error);
		throw error;
	}
}

/**
 * Get the current plugin manager instance
 * This is the main function used throughout the codebase
 */
export function getPluginManagerInstance(): PluginManager | null {
	return pluginManagerInstance;
}

/**
 * Check if the plugin system has been initialized
 */
export function isPluginSystemInitialized(): boolean {
	return pluginManagerInstance?.isSystemInitialized() ?? false;
}

/**
 * Destroys the plugin system (useful for testing)
 */
export async function destroyPluginSystem(): Promise<void> {
	if (!pluginManagerInstance) {
		return;
	}

	try {
		// Use graceful shutdown to avoid unnecessary deactivation and schema updates
		await pluginManagerInstance.gracefulShutdown();

		pluginManagerInstance = null;
	} catch (error) {
		rootLogger.error({ msg: "Error destroying plugin system", err: error });
		throw error;
	}
}

/**
 * Plugin system health check and status information
 */
export function getPluginSystemStatus(): {
	initialized: boolean;
	pluginCount: number;
	activePluginCount: number;
	errors: unknown[];
} {
	if (!pluginManagerInstance) {
		return {
			initialized: false,
			pluginCount: 0,
			activePluginCount: 0,
			errors: [],
		};
	}

	return {
		initialized: pluginManagerInstance.isSystemInitialized(),
		pluginCount: pluginManagerInstance.getLoadedPlugins().length,
		activePluginCount: pluginManagerInstance.getActivePlugins().length,
		errors: pluginManagerInstance.getErrors(),
	};
}
