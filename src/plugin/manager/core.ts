/**
 * Core Plugin Manager for Talawa API
 *
 * This is the main plugin management class that handles discovery, loading,
 * activation, and lifecycle management of plugins in the Talawa API.
 */

import { EventEmitter } from "node:events";
import path from "node:path";
import { eq } from "drizzle-orm";
import { pluginsTable } from "~/src/drizzle/tables/plugins";

import type {
	IDatabaseClient,
	IExtensionRegistry,
	ILoadedPlugin,
	IPluginContext,
	IPluginError,
	IPluginManifest,
} from "../types";
import { PluginStatus } from "../types";
import {
	directoryExists,
	isValidPluginId,
	loadPluginManifest,
	safeRequire,
} from "../utils";
import { ExtensionLoader } from "./extensions.js";
import { PluginLifecycle } from "./lifecycle.js";
import { PluginRegistry } from "./registry.js";

class PluginManager extends EventEmitter {
	private loadedPlugins: Map<string, ILoadedPlugin> = new Map();
	private extensionRegistry: IExtensionRegistry = {
		graphql: {
			builderExtensions: [],
		},
		database: {
			tables: {},
			enums: {},
			relations: {},
		},
		hooks: {
			pre: {},
			post: {},
		},
		webhooks: {
			handlers: {},
		},
	};
	private pluginContext: IPluginContext;
	private pluginsDirectory: string;
	private isInitialized = false;
	private errors: IPluginError[] = [];

	// Component instances
	private extensionLoader: ExtensionLoader;
	private lifecycle: PluginLifecycle;
	private registry: PluginRegistry;

	constructor(context: IPluginContext, pluginsDir?: string) {
		super();
		this.pluginContext = context;
		this.pluginsDirectory =
			pluginsDir || path.join(process.cwd(), "src", "plugin", "available");

		// Initialize components
		this.extensionLoader = new ExtensionLoader(
			this.pluginsDirectory,
			this.loadedPlugins,
			this.extensionRegistry,
		);
		this.lifecycle = new PluginLifecycle(
			this.pluginContext,
			this.loadedPlugins,
			this.extensionRegistry,
		);
		this.registry = new PluginRegistry(this.pluginContext);

		// Initialize plugin system
		this.initializePlugins().catch((error) => {
			console.error("Plugin system initialization failed:", error);
		});
	}

	/**
	 * Initialize the plugin system
	 */
	private async initializePlugins(): Promise<void> {
		try {
			this.emit("plugins:initializing");

			// Ensure plugins directory exists (create if needed)
			const pluginsDirExists = await directoryExists(this.pluginsDirectory);
			if (!pluginsDirExists) {
				try {
					await import("node:fs/promises").then((fs) =>
						fs.mkdir(this.pluginsDirectory, { recursive: true }),
					);
				} catch (error) {
					console.error("Failed to create plugins directory:", error);
				}
			}

			// Get installed plugins from database (DATABASE IS SOURCE OF TRUTH)
			const installedPlugins = await this.getInstalledPlugins();

			if (installedPlugins.length === 0) {
				console.log("No plugins found in database");
				this.markAsInitialized();
				return;
			}

			// Load each installed plugin directly from database
			const loadResults = await Promise.allSettled(
				installedPlugins.map(async (dbPlugin) => {
					try {
						const success = await this.loadPlugin(dbPlugin.pluginId);
						return { pluginId: dbPlugin.pluginId, success };
					} catch (error) {
						console.error(
							`❌ Failed to load plugin ${dbPlugin.pluginId}:`,
							error,
						);
						this.handlePluginError(dbPlugin.pluginId, error as Error, "load");
						return { pluginId: dbPlugin.pluginId, success: false, error };
					}
				}),
			);

			// Log results summary
			const successful = loadResults.filter(
				(result) => result.status === "fulfilled" && result.value.success,
			).length;
			const failed = loadResults.length - successful;

			if (successful > 0 || failed > 0) {
				console.log(
					`Plugin system initialized: ${successful} loaded, ${failed} failed`,
				);
			}

			this.markAsInitialized();
			this.emit("plugins:initialized", this.getLoadedPluginIds());
		} catch (error) {
			console.error("Plugin system initialization failed:", error);
			this.markAsInitialized();
		}
	}

	private markAsInitialized(): void {
		this.isInitialized = true;
		this.emit("plugins:ready");
	}

	/**
	 * Get plugins that are marked as installed in the database
	 */
	private async getInstalledPlugins(): Promise<
		Array<typeof pluginsTable.$inferSelect>
	> {
		try {
			const queryBuilder = (this.pluginContext.db as IDatabaseClient)
				.select()
				.from(pluginsTable);
			const results = await queryBuilder.where(
				eq(pluginsTable.isInstalled, true),
			);

			return results as Array<typeof pluginsTable.$inferSelect>;
		} catch (error) {
			console.error(
				"❌ Error fetching installed plugins from database:",
				error,
			);
			return [];
		}
	}

	/**
	 * Load a specific plugin
	 */
	public async loadPlugin(pluginId: string): Promise<boolean> {
		if (!isValidPluginId(pluginId)) {
			throw new Error(`Invalid plugin ID: ${pluginId}`);
		}

		try {
			this.emit("plugin:loading", pluginId);

			// Check if plugin is already loaded
			if (this.loadedPlugins.has(pluginId)) {
				return true;
			}

			// Check if plugin files exist
			const pluginPath = path.join(this.pluginsDirectory, pluginId);
			const manifestPath = path.join(pluginPath, "manifest.json");

			try {
				await import("node:fs/promises").then((fs) => fs.access(manifestPath));
			} catch (_error) {
				console.warn(
					`⚠️  Plugin ${pluginId} is in database but files are missing at ${pluginPath}`,
				);
				return false;
			}

			// Load plugin manifest
			let manifest: IPluginManifest;
			try {
				manifest = await loadPluginManifest(pluginPath);
			} catch (error) {
				console.error(
					`❌ Failed to load manifest for plugin ${pluginId}:`,
					error,
				);
				return false;
			}

			// Load plugin module
			let pluginModule: Record<string, unknown>;
			try {
				pluginModule = await this.loadPluginModule(pluginPath, manifest);
			} catch (error) {
				console.error(
					`❌ Failed to load module for plugin ${pluginId}:`,
					error,
				);
				return false;
			}

			// Determine initial status from database
			const dbPlugin = await this.getPluginFromDatabase(pluginId);
			const status = dbPlugin?.isActivated
				? PluginStatus.ACTIVE
				: PluginStatus.INACTIVE;

			// Create loaded plugin object
			const loadedPlugin: ILoadedPlugin = {
				id: pluginId,
				manifest,
				graphqlResolvers: {},
				databaseTables: {} as Record<string, Record<string, unknown>>,
				hooks: {},
				webhooks: {},
				status: PluginStatus.LOADING,
			};

			this.loadedPlugins.set(pluginId, loadedPlugin);

			// Load extension points into memory (database tables already created by createPlugin mutation)
			try {
				await this.extensionLoader.loadExtensionPoints(
					pluginId,
					manifest,
					pluginModule,
				);
			} catch (error) {
				// Remove from loaded plugins if extension loading fails
				this.loadedPlugins.delete(pluginId);
				console.error(
					`❌ Failed to load extension points for plugin ${pluginId}:`,
					error,
				);
				return false;
			}

			// Update status
			loadedPlugin.status = status;

			// Activate plugin if it should be active
			if (status === PluginStatus.ACTIVE) {
				try {
					await this.activatePlugin(pluginId);
				} catch (error) {
					// Don't return false here - plugin is loaded but not activated
					console.error(
						`❌ Failed to activate plugin ${pluginId} during load:`,
						error,
					);
				}
			}

			this.emit("plugin:loaded", pluginId);
			return true;
		} catch (error) {
			console.error(`❌ Failed to load plugin ${pluginId}:`, error);
			this.handlePluginError(pluginId, error as Error, "load");
			return false;
		}
	}

	/**
	 * Load plugin module
	 */
	private async loadPluginModule(
		pluginPath: string,
		manifest: IPluginManifest,
	): Promise<Record<string, unknown>> {
		const mainFilePath = path.join(pluginPath, manifest.main);

		const pluginModule = await safeRequire(mainFilePath);

		if (!pluginModule) {
			throw new Error(`Failed to load plugin module: ${manifest.main}`);
		}

		return pluginModule as Record<string, unknown>;
	}

	/**
	 * Install a plugin
	 */
	public async installPlugin(pluginId: string): Promise<boolean> {
		return this.lifecycle.installPlugin(pluginId, this);
	}

	/**
	 * Activate a plugin
	 */
	public async activatePlugin(pluginId: string): Promise<boolean> {
		return this.lifecycle.activatePlugin(pluginId, this);
	}

	/**
	 * Deactivate a plugin
	 */
	public async deactivatePlugin(
		pluginId: string,
		dropTables = false,
	): Promise<boolean> {
		return this.lifecycle.deactivatePlugin(pluginId, this, dropTables);
	}

	/**
	 * Uninstall a plugin
	 */
	public async uninstallPlugin(pluginId: string): Promise<boolean> {
		return this.lifecycle.uninstallPlugin(pluginId, this);
	}

	/**
	 * Unload a plugin from memory
	 */
	public async unloadPlugin(pluginId: string): Promise<boolean> {
		return this.lifecycle.unloadPlugin(pluginId, this);
	}

	/**
	 * Get plugin from database
	 */
	private async getPluginFromDatabase(
		pluginId: string,
	): Promise<typeof pluginsTable.$inferSelect | null> {
		return this.registry.getPluginFromDatabase(pluginId);
	}

	/**
	 * Handle plugin errors
	 */
	private handlePluginError(
		pluginId: string,
		error: Error,
		phase: IPluginError["phase"],
	): void {
		const pluginError: IPluginError = {
			pluginId,
			error,
			phase,
			timestamp: new Date(),
		};

		this.errors.push(pluginError);

		// Update plugin status to error
		const plugin = this.loadedPlugins.get(pluginId);
		if (plugin) {
			plugin.status = PluginStatus.ERROR;
			plugin.errorMessage = error.message;
		}

		this.emit("plugin:error", pluginError);
	}

	// Public API methods

	/**
	 * Get all loaded plugins
	 */
	public getLoadedPlugins(): ILoadedPlugin[] {
		return Array.from(this.loadedPlugins.values());
	}

	/**
	 * Get loaded plugin IDs
	 */
	public getLoadedPluginIds(): string[] {
		return Array.from(this.loadedPlugins.keys());
	}

	/**
	 * Get active plugins
	 */
	public getActivePlugins(): ILoadedPlugin[] {
		return this.getLoadedPlugins().filter(
			(plugin) => plugin.status === PluginStatus.ACTIVE,
		);
	}

	/**
	 * Get a specific plugin
	 */
	public getPlugin(pluginId: string): ILoadedPlugin | undefined {
		return this.loadedPlugins.get(pluginId);
	}

	/**
	 * Check if plugin is loaded
	 */
	public isPluginLoaded(pluginId: string): boolean {
		return this.loadedPlugins.has(pluginId);
	}

	/**
	 * Check if plugin is active
	 */
	public isPluginActive(pluginId: string): boolean {
		const plugin = this.loadedPlugins.get(pluginId);
		return plugin?.status === PluginStatus.ACTIVE;
	}

	/**
	 * Get extension registry
	 */
	public getExtensionRegistry(): IExtensionRegistry {
		return this.extensionRegistry;
	}

	/**
	 * Execute pre hooks for an event
	 */
	public async executePreHooks(event: string, data: unknown): Promise<unknown> {
		const hooks = this.extensionRegistry.hooks.pre[event] || [];
		let result = data;

		for (const hook of hooks) {
			try {
				result = await hook(result, this.pluginContext);
			} catch (error) {
				console.error(`Error executing pre hook for event ${event}:`, error);
			}
		}

		return result;
	}

	/**
	 * Execute post hooks for an event
	 */
	public async executePostHooks(event: string, data: unknown): Promise<void> {
		const hooks = this.extensionRegistry.hooks.post[event] || [];

		await Promise.allSettled(
			hooks.map(async (hook) => {
				try {
					await hook(data, this.pluginContext);
				} catch (error) {
					console.error(
						`❌ Error executing post hook for event ${event}:`,
						error,
					);
				}
			}),
		);
	}

	/**
	 * Get plugin errors
	 */
	public getErrors(): IPluginError[] {
		return [...this.errors];
	}

	/**
	 * Clear plugin errors
	 */
	public clearErrors(): void {
		this.errors = [];
	}

	/**
	 * Check if system is initialized
	 */
	public isSystemInitialized(): boolean {
		return this.isInitialized;
	}

	/**
	 * Get plugins directory
	 */
	public getPluginsDirectory(): string {
		return this.pluginsDirectory;
	}

	/**
	 * Get plugin context
	 */
	public getPluginContext(): IPluginContext {
		return this.pluginContext;
	}

	/**
	 * Gracefully shutdown plugin system without triggering deactivation or schema updates
	 * This is used during server shutdown to avoid unnecessary operations
	 */
	public async gracefulShutdown(): Promise<void> {
		try {
			// Get all loaded plugin IDs
			const pluginIds = Array.from(this.loadedPlugins.keys());

			// Call onUnload lifecycle hooks for each plugin without deactivation
			await Promise.allSettled(
				pluginIds.map(async (pluginId) => {
					try {
						const plugin = this.loadedPlugins.get(pluginId);
						if (!plugin) return;

						// Call plugin lifecycle hook if available
						const pluginModule = await this.lifecycle.getPluginModule(pluginId);
						if (pluginModule?.onUnload) {
							await pluginModule.onUnload(this.pluginContext);
						}

						// Remove from extension registry
						this.lifecycle.removeFromExtensionRegistry(pluginId);

						// Remove from loaded plugins
						this.loadedPlugins.delete(pluginId);

						this.emit("plugin:unloaded", pluginId);
					} catch (error) {
						console.error(
							`Error during graceful shutdown of plugin ${pluginId}:`,
							error,
						);
					}
				}),
			);

			// Clear extension registry
			this.extensionRegistry = {
				graphql: {
					builderExtensions: [],
				},
				database: {
					tables: {},
					enums: {},
					relations: {},
				},
				hooks: {
					pre: {},
					post: {},
				},
				webhooks: {
					handlers: {},
				},
			};

			// Remove all listeners
			this.removeAllListeners();
		} catch (error) {
			console.error("Error during graceful plugin system shutdown:", error);
		}
	}
}

export default PluginManager;
