/**
 * Plugin Lifecycle Manager
 *
 * Handles isolated plugin lifecycle processes:
 * - Plugin creation: No manager-specific actions
 * - Plugin installation: Create plugin-defined databases
 * - Plugin activation: Trigger schema rebuild
 * - Plugin deactivation: Trigger schema rebuild
 * - Plugin uninstall: Remove tables and cleanup
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
	IPluginManifest,
} from "../types";

// Type for plugin manager with emit method
interface IPluginManager {
	emit(event: string, ...args: unknown[]): boolean;
}

import { installPluginDependenciesWithErrorHandling } from "~/src/utilities/pluginDependencyInstaller";
import { TalawaGraphQLError } from "~/src/utilities/TalawaGraphQLError";
import { PluginStatus } from "../types";
import { createPluginTables, dropPluginTables, safeRequire } from "../utils";

export class PluginLifecycle {
	constructor(
		private pluginContext: IPluginContext,
		private loadedPlugins: Map<string, ILoadedPlugin>,
		private extensionRegistry: IExtensionRegistry,
	) {}

	/**
	 * Install a plugin - install dependencies and create plugin-defined databases
	 */
	public async installPlugin(
		pluginId: string,
		pluginManager: IPluginManager,
	): Promise<boolean> {
		try {
			pluginManager.emit("plugin:installing", pluginId);

			// Load plugin manifest to get database definitions
			const manifest = await this.loadPluginManifest(pluginId);
			if (!manifest) {
				throw new Error(`Failed to load manifest for plugin ${pluginId}`);
			}

			// Install plugin dependencies first
			console.log(`Installing dependencies for plugin: ${pluginId}`);
			await installPluginDependenciesWithErrorHandling(pluginId, console);

			// Create plugin-defined databases if specified
			await this.createPluginDatabases(pluginId, manifest);

			// Call plugin lifecycle hook
			await this.callOnInstallHook(pluginId);

			pluginManager.emit("plugin:installed", pluginId);
			return true;
		} catch (error) {
			this.handlePluginError(pluginId, error as Error, "install");
			return false;
		}
	}

	/**
	 * Uninstall a plugin - remove tables and cleanup
	 */
	public async uninstallPlugin(
		pluginId: string,
		pluginManager: IPluginManager,
	): Promise<boolean> {
		try {
			pluginManager.emit("plugin:uninstalling", pluginId);

			// Call plugin lifecycle hook first
			await this.callOnUninstallHook(pluginId);

			// Remove plugin-defined databases
			await this.removePluginDatabases(pluginId);

			// Remove from extension registry
			this.removeFromExtensionRegistry(pluginId);

			// Remove from loaded plugins
			this.loadedPlugins.delete(pluginId);

			// Trigger schema rebuild to ensure complete cleanup
			await this.triggerSchemaRebuild();

			pluginManager.emit("plugin:uninstalled", pluginId);
			return true;
		} catch (error) {
			this.handlePluginError(pluginId, error as Error, "uninstall");
			return false;
		}
	}

	/**
	 * Activate a plugin - trigger schema rebuild
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

			// Call plugin lifecycle hook
			await this.callOnActivateHook(pluginId);

			// Update plugin status
			plugin.status = PluginStatus.ACTIVE;

			// Update database
			await this.updatePluginInDatabase(pluginId, { isActivated: true });

			// Trigger schema rebuild to integrate plugin extensions
			await this.triggerSchemaRebuild();

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
	 * Trigger schema rebuild to integrate/remove plugin extensions
	 */
	private async triggerSchemaRebuild(): Promise<void> {
		try {
			const { schemaManager } = await import("../../graphql/schemaManager");
			await schemaManager.rebuildSchema();
		} catch (error) {
			console.error("Schema rebuild failed:", error);
		}
	}

	/**
	 * Deactivate a plugin - trigger schema rebuild
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
			return true;
		}

		try {
			pluginManager.emit("plugin:deactivating", pluginId);

			// Call plugin lifecycle hook
			await this.callOnDeactivateHook(pluginId);

			// Update plugin status
			plugin.status = PluginStatus.INACTIVE;

			// Update database
			await this.updatePluginInDatabase(pluginId, { isActivated: false });

			// Optionally drop plugin tables
			if (dropTables) {
				await this.removePluginDatabases(pluginId);
			}

			// Trigger schema rebuild to remove plugin extensions
			await this.triggerSchemaRebuild();

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
	 * Load plugin manifest
	 */
	private async loadPluginManifest(pluginId: string): Promise<IPluginManifest> {
		const pluginPath = path.join(
			process.cwd(),
			"src",
			"plugin",
			"available",
			pluginId,
		);
		const manifestPath = path.join(pluginPath, "manifest.json");
		const manifest = await safeRequire(manifestPath);
		if (!manifest) {
			throw new Error(`Failed to load manifest for plugin ${pluginId}`);
		}
		return manifest as IPluginManifest;
	}

	/**
	 * Create plugin-defined databases
	 */
	private async createPluginDatabases(
		pluginId: string,
		manifest: IPluginManifest,
	): Promise<void> {
		if (
			manifest.extensionPoints?.database &&
			manifest.extensionPoints.database.length > 0
		) {
			console.log(`Creating plugin-defined tables for: ${pluginId}`);

			const tableDefinitions: Record<string, Record<string, unknown>> = {};
			const pluginPath = path.join(
				process.cwd(),
				"src",
				"plugin",
				"available",
				pluginId,
			);

			// Load each table definition
			for (const tableExtension of manifest.extensionPoints.database) {
				console.log(
					"Loading table definition:",
					tableExtension.name,
					"from",
					tableExtension.file,
				);

				const tableFilePath = path.join(pluginPath, tableExtension.file);
				const tableModule =
					await safeRequire<Record<string, Record<string, unknown>>>(
						tableFilePath,
					);

				if (!tableModule) {
					throw new Error(`Failed to load table file: ${tableExtension.file}`);
				}

				const tableDefinition = tableModule[tableExtension.name] as Record<
					string,
					unknown
				>;
				if (!tableDefinition) {
					throw new Error(
						`Table '${tableExtension.name}' not found in file: ${tableExtension.file}`,
					);
				}

				tableDefinitions[tableExtension.name] = tableDefinition;
				console.log("Table definition loaded:", tableExtension.name);
			}

			// Create the plugin-defined tables
			try {
				await createPluginTables(
					this.pluginContext.db as unknown as {
						execute: (sql: string) => Promise<unknown>;
					},
					pluginId,
					tableDefinitions,
					console, // Using console as logger
				);
				console.log(
					"Successfully created plugin-defined tables for:",
					pluginId,
				);
			} catch (error) {
				console.error(`Failed to create tables for ${pluginId}:`, error);
				throw new TalawaGraphQLError({
					extensions: {
						code: "forbidden_action_on_arguments_associated_resources",
						issues: [
							{
								argumentPath: ["input", "pluginId"],
								message: "Failed to create plugin database tables",
							},
						],
					},
				});
			}
		} else {
			console.log("No plugin-defined tables found for:", pluginId);
		}
	}

	/**
	 * Remove plugin-defined databases
	 */
	private async removePluginDatabases(pluginId: string): Promise<void> {
		const plugin = this.loadedPlugins.get(pluginId);
		if (!plugin || !plugin.databaseTables) return;

		try {
			await dropPluginTables(
				this.pluginContext.db as {
					execute: (sql: string) => Promise<unknown>;
				},
				pluginId,
				plugin.databaseTables as Record<string, Record<string, unknown>>,
				this.pluginContext.logger as { info?: (message: string) => void },
			);
			console.log(
				`Successfully removed plugin-defined tables for: ${pluginId}`,
			);
		} catch (error) {
			console.error(`Failed to remove tables for ${pluginId}:`, error);
		}
	}

	/**
	 * Get plugin module for lifecycle hooks
	 */
	public async getPluginModule(
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
	public removeFromExtensionRegistry(pluginId: string): void {
		// Remove GraphQL builder extensions
		this.extensionRegistry.graphql.builderExtensions =
			this.extensionRegistry.graphql.builderExtensions.filter(
				(extension) => extension.pluginId !== pluginId,
			);

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
	 * Call the onInstall lifecycle hook for a plugin
	 */
	private async callOnInstallHook(pluginId: string): Promise<void> {
		try {
			const pluginModule = await this.getPluginModule(pluginId);
			if (pluginModule?.onInstall) {
				await pluginModule.onInstall(this.pluginContext);
			}
		} catch (error) {
			console.error(
				`Error calling onInstall lifecycle hook for plugin ${pluginId}:`,
				error,
			);
		}
	}

	/**
	 * Call the onActivate lifecycle hook for a plugin
	 */
	private async callOnActivateHook(pluginId: string): Promise<void> {
		try {
			const pluginModule = await this.getPluginModule(pluginId);
			if (pluginModule?.onActivate) {
				await pluginModule.onActivate(this.pluginContext);
			}
		} catch (error) {
			console.error(
				`Error calling onActivate lifecycle hook for plugin ${pluginId}:`,
				error,
			);
		}
	}

	/**
	 * Call the onDeactivate lifecycle hook for a plugin
	 */
	private async callOnDeactivateHook(pluginId: string): Promise<void> {
		try {
			const pluginModule = await this.getPluginModule(pluginId);
			if (pluginModule?.onDeactivate) {
				await pluginModule.onDeactivate(this.pluginContext);
			}
		} catch (error) {
			console.error(
				`Error calling onDeactivate lifecycle hook for plugin ${pluginId}:`,
				error,
			);
		}
	}

	/**
	 * Call the onUninstall lifecycle hook for a plugin
	 */
	private async callOnUninstallHook(pluginId: string): Promise<void> {
		try {
			const pluginModule = await this.getPluginModule(pluginId);
			if (pluginModule?.onUninstall) {
				await pluginModule.onUninstall(this.pluginContext);
			}
		} catch (error) {
			console.error(
				`Error calling onUninstall lifecycle hook for plugin ${pluginId}:`,
				error,
			);
		}
	}

	/**
	 * Unload a plugin - remove from memory without database changes
	 */
	public async unloadPlugin(
		pluginId: string,
		pluginManager: IPluginManager,
	): Promise<boolean> {
		const plugin = this.loadedPlugins.get(pluginId);
		if (!plugin) {
			// Plugin is already unloaded
			return true;
		}

		try {
			pluginManager.emit("plugin:unloading", pluginId);

			// Call plugin lifecycle hook
			await this.callOnUnloadHook(pluginId);

			// Remove from extension registry
			this.removeFromExtensionRegistry(pluginId);

			// Remove from loaded plugins
			this.loadedPlugins.delete(pluginId);

			pluginManager.emit("plugin:unloaded", pluginId);
			return true;
		} catch (error) {
			this.handlePluginError(pluginId, error as Error, "unload");
			return false;
		}
	}

	/**
	 * Call the onUnload lifecycle hook for a plugin
	 */
	private async callOnUnloadHook(pluginId: string): Promise<void> {
		try {
			const pluginModule = await this.getPluginModule(pluginId);
			if (pluginModule?.onUnload) {
				await pluginModule.onUnload(this.pluginContext);
			}
		} catch (error) {
			console.error(
				`Error calling onUnload lifecycle hook for plugin ${pluginId}:`,
				error,
			);
		}
	}

	/**
	 * Handle plugin errors
	 */
	private handlePluginError(
		pluginId: string,
		error: Error,
		phase: "install" | "activate" | "deactivate" | "uninstall" | "unload",
	): void {
		console.error(`Plugin ${pluginId} error during ${phase}:`, error);
	}
}
