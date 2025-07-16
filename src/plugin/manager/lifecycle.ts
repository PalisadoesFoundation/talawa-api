/**
 * Plugin Lifecycle Manager
 *
 * Handles plugin activation, deactivation, and unloading operations
 * including database updates and schema integration.
 */

import path from "node:path";
import { eq } from "drizzle-orm";
import { pluginsTable } from "~/src/drizzle/tables/plugins";

import type {
	IDatabaseClient,
	IExtensionRegistry,
	ILoadedPlugin,
	IPluginContext,
	IPluginLifecycle,
} from "../types";

// Type for plugin manager with emit method
interface IPluginManager {
	emit(event: string, ...args: unknown[]): boolean;
}
import { PluginStatus } from "../types";
import { dropPluginTables, safeRequire } from "../utils";

export class PluginLifecycle {
	constructor(
		private pluginContext: IPluginContext,
		private loadedPlugins: Map<string, ILoadedPlugin>,
		private extensionRegistry: IExtensionRegistry,
	) {}

	/**
	 * Activate a plugin
	 */
	public async activatePlugin(
		pluginId: string,
		pluginManager: IPluginManager,
	): Promise<boolean> {
		const plugin = this.loadedPlugins.get(pluginId);
		if (!plugin) {
			throw new Error(`Plugin ${pluginId} is not loaded`);
		}

		try {
			pluginManager.emit("plugin:activating", pluginId);

			// Update plugin status FIRST - before triggering schema integration
			plugin.status = PluginStatus.ACTIVE;

			// Call plugin lifecycle hook
			const pluginModule = await this.getPluginModule(pluginId);
			if (pluginModule?.onActivate) {
				await pluginModule.onActivate(this.pluginContext);
			}

			// Update database
			await this.updatePluginInDatabase(pluginId, { isActivated: true });

			// Integrate GraphQL extensions into the main API schema AFTER status is set
			await this.integrateGraphQLExtensions(pluginId);

			pluginManager.emit("plugin:activated", pluginId);
			return true;
		} catch (error) {
			// Reset status on error
			plugin.status = PluginStatus.INACTIVE;
			this.handlePluginError(pluginId, error as Error, "activate");
			return false;
		}
	}

	/**
	 * Integrate GraphQL extensions from a plugin into the main API schema
	 */
	private async integrateGraphQLExtensions(pluginId: string): Promise<void> {
		console.log("🚀 GraphQL Schema Integration Started", {
			pluginId,
			phase: "activation_integration",
			timestamp: new Date().toISOString(),
		});

		// Emit the schema rebuild event
		// Note: This assumes the pluginManager has an emit method
		// We'll need to pass the pluginManager instance or use a different approach

		// Also try to trigger schema rebuild directly as a fallback
		try {
			const { schemaManager } = await import("../../graphql/schemaManager");
			console.log("🔄 Manually Triggering Schema Rebuild", {
				pluginId,
				reason: "direct_fallback_call",
			});
			await schemaManager.rebuildSchema();
			console.log("✅ Manual Schema Rebuild Completed", {
				pluginId,
			});
		} catch (error) {
			console.log("⚠️ Manual Schema Rebuild Failed", {
				pluginId,
				error: error instanceof Error ? error.message : String(error),
				reason: "fallback_failed",
			});
		}

		console.log("🎉 GraphQL Schema Integration Completed", {
			pluginId,
			reason: "delegated_to_schema_manager",
			timestamp: new Date().toISOString(),
		});
	}

	/**
	 * Deactivate a plugin
	 */
	public async deactivatePlugin(
		pluginId: string,
		pluginManager: IPluginManager,
		dropTables = false,
	): Promise<boolean> {
		const plugin = this.loadedPlugins.get(pluginId);
		if (!plugin) {
			throw new Error(`Plugin ${pluginId} is not loaded`);
		}

		if (plugin.status !== PluginStatus.ACTIVE) {
			console.warn(`Plugin ${pluginId} is not currently active`);
			return true;
		}

		try {
			pluginManager.emit("plugin:deactivating", pluginId);

			// Update plugin status FIRST to ensure schema rebuild excludes it
			plugin.status = PluginStatus.INACTIVE;

			// Call plugin lifecycle hook
			const pluginModule = await this.getPluginModule(pluginId);
			if (pluginModule?.onDeactivate) {
				await pluginModule.onDeactivate(this.pluginContext);
			}

			// Optionally drop database tables (data will be lost!)
			if (dropTables && Object.keys(plugin.databaseTables).length > 0) {
				await dropPluginTables(
					this.pluginContext.db as {
						execute: (sql: string) => Promise<unknown>;
					},
					pluginId,
					plugin.databaseTables as Record<string, Record<string, unknown>>,
					this.pluginContext.logger as { info?: (message: string) => void },
				);
			}

			// Update database
			await this.updatePluginInDatabase(pluginId, { isActivated: false });

			// Trigger schema rebuild to remove plugin extensions
			await this.triggerSchemaRebuildForDeactivation(pluginId);

			pluginManager.emit("plugin:deactivated", pluginId);
			return true;
		} catch (error) {
			// Reset status on error
			plugin.status = PluginStatus.ACTIVE;
			this.handlePluginError(pluginId, error as Error, "deactivate");
			return false;
		}
	}

	/**
	 * Unload a plugin
	 */
	public async unloadPlugin(
		pluginId: string,
		pluginManager: IPluginManager,
	): Promise<boolean> {
		const plugin = this.loadedPlugins.get(pluginId);
		if (!plugin) {
			return true; // Already unloaded
		}

		try {
			pluginManager.emit("plugin:unloading", pluginId);

			// Deactivate first if active
			if (plugin.status === PluginStatus.ACTIVE) {
				await this.deactivatePlugin(pluginId, pluginManager, false);
			}

			// Call plugin lifecycle hook
			const pluginModule = await this.getPluginModule(pluginId);
			if (pluginModule?.onUnload) {
				await pluginModule.onUnload(this.pluginContext);
			}

			// Remove from extension registry
			this.removeFromExtensionRegistry(pluginId);

			// Remove from loaded plugins
			this.loadedPlugins.delete(pluginId);

			// Trigger final schema rebuild to ensure complete cleanup
			await this.triggerSchemaRebuildForDeactivation(pluginId);

			pluginManager.emit("plugin:unloaded", pluginId);
			return true;
		} catch (error) {
			this.handlePluginError(pluginId, error as Error, "unload");
			return false;
		}
	}

	/**
	 * Trigger schema rebuild for plugin deactivation/unloading
	 */
	private async triggerSchemaRebuildForDeactivation(
		pluginId: string,
	): Promise<void> {
		try {
			// Also try to trigger schema rebuild directly as a fallback
			const { schemaManager } = await import("../../graphql/schemaManager");
			await schemaManager.rebuildSchema();

			console.log("✅ Schema Rebuilt After Plugin Deactivation", {
				pluginId,
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error("❌ Schema Rebuild Failed After Plugin Deactivation", {
				pluginId,
				error: error instanceof Error ? error.message : String(error),
			});
			// Don't throw - this shouldn't break the deactivation process
		}
	}

	/**
	 * Get plugin module for lifecycle hooks
	 */
	private async getPluginModule(
		pluginId: string,
	): Promise<IPluginLifecycle | null> {
		const plugin = this.loadedPlugins.get(pluginId);
		if (!plugin) return null;

		const pluginPath = path.join(
			process.cwd(),
			"src",
			"plugin",
			"available",
			pluginId,
		);
		const mainFilePath = path.join(pluginPath, plugin.manifest.main);
		return await safeRequire(mainFilePath);
	}

	/**
	 * Remove plugin from extension registry
	 */
	private removeFromExtensionRegistry(pluginId: string): void {
		// Remove GraphQL extensions
		for (const type of Object.keys(this.extensionRegistry.graphql)) {
			const extensions = this.extensionRegistry.graphql[
				type as keyof typeof this.extensionRegistry.graphql
			] as Record<string, { pluginId: string }>;
			for (const name of Object.keys(extensions)) {
				if (extensions[name]?.pluginId === pluginId) {
					delete extensions[name];
				}
			}
		}

		// Remove Database extensions
		for (const type of Object.keys(this.extensionRegistry.database)) {
			const extensions = this.extensionRegistry.database[
				type as keyof typeof this.extensionRegistry.database
			] as Record<string, { pluginId: string }>;
			for (const name of Object.keys(extensions)) {
				if (extensions[name]?.pluginId === pluginId) {
					delete extensions[name];
				}
			}
		}

		// Remove Hook extensions
		for (const type of Object.keys(this.extensionRegistry.hooks)) {
			const hookType = type as "pre" | "post";
			for (const event of Object.keys(this.extensionRegistry.hooks[hookType])) {
				const handlers = this.extensionRegistry.hooks[hookType][event];
				if (handlers) {
					this.extensionRegistry.hooks[hookType][event] = handlers.filter(
						(
							handler: ((...args: unknown[]) => unknown) & {
								pluginId?: string;
							},
						) => handler.pluginId !== pluginId,
					);
				}
			}
		}
	}

	/**
	 * Update plugin in database
	 */
	private async updatePluginInDatabase(
		pluginId: string,
		updates: Partial<typeof pluginsTable.$inferInsert>,
	): Promise<void> {
		try {
			const updateBuilder = (this.pluginContext.db as IDatabaseClient)
				.update(pluginsTable)
				.set(updates);
			await updateBuilder.where(eq(pluginsTable.pluginId, pluginId));
		} catch (error) {
			console.error("Error updating plugin in database:", error);
			throw error;
		}
	}

	/**
	 * Handle plugin errors
	 */
	private handlePluginError(
		pluginId: string,
		error: Error,
		phase: "activate" | "deactivate" | "unload",
	): void {
		console.error(`Plugin ${pluginId} error during ${phase}:`, error);
	}
}
