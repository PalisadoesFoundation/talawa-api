/**
 * Plugin Registry and Initialization Utilities for Talawa API
 *
 * This file provides utilities for initializing the plugin system
 * and creating the plugin context required by the plugin manager.
 */

import PluginManager from "./manager";
import type { IPluginContext } from "./types";

// Global plugin manager instance
let pluginManagerInstance: PluginManager | null = null;

/**
 * Creates a plugin context object with all necessary dependencies
 */
export function createPluginContext(dependencies: {
	db: unknown;
	graphql: unknown;
	pubsub: unknown;
	logger: unknown;
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
		console.warn("Plugin system is already initialized");
		return pluginManagerInstance;
	}

	try {
		context.logger?.info("Initializing plugin system...");

		pluginManagerInstance = new PluginManager(context, pluginsDirectory);

		// Wait for initialization to complete
		await new Promise<void>((resolve) => {
			pluginManagerInstance?.once("plugins:ready", () => {
				resolve();
			});
		});

		context.logger?.info("Plugin system initialized successfully");
		return pluginManagerInstance;
	} catch (error) {
		context.logger?.error("Failed to initialize plugin system:", error);
		throw error;
	}
}

/**
 * Gets the global plugin manager instance
 */
export function getPluginManager(): PluginManager | null {
	return pluginManagerInstance;
}

/**
 * Checks if the plugin system is initialized
 */
export function isPluginSystemInitialized(): boolean {
	return pluginManagerInstance?.isSystemInitialized() ?? false;
}

/**
 * Gets the plugin manager instance
 */
export function getPluginManagerInstance(): PluginManager | null {
	return pluginManagerInstance;
}

/**
 * Destroys the plugin system (useful for testing)
 */
export async function destroyPluginSystem(): Promise<void> {
	if (!pluginManagerInstance) {
		return;
	}

	try {
		// Unload all plugins
		const loadedPlugins = pluginManagerInstance.getLoadedPluginIds();
		await Promise.all(
			loadedPlugins.map((pluginId) =>
				pluginManagerInstance?.unloadPlugin(pluginId),
			),
		);

		// Remove all listeners
		pluginManagerInstance.removeAllListeners();

		pluginManagerInstance = null;
	} catch (error) {
		console.error("Error destroying plugin system:", error);
		throw error;
	}
}

/**
 * Plugin system health check
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
