/**
 * Extension Loader for Plugin Manager
 *
 * Handles loading and registration of GraphQL, Database, and Hook extensions
 * from plugins into the extension registry.
 */

import path from "node:path";
import type {
	IDatabaseExtension,
	IExtensionRegistry,
	IGraphQLExtension,
	IHookExtension,
	ILoadedPlugin,
	IPluginManifest,
} from "../types";
import { safeRequire } from "../utils";

export class ExtensionLoader {
	constructor(
		private pluginsDirectory: string,
		private loadedPlugins: Map<string, ILoadedPlugin>,
		private extensionRegistry: IExtensionRegistry,
	) {}

	/**
	 * Load extension points for a plugin
	 */
	public async loadExtensionPoints(
		pluginId: string,
		manifest: IPluginManifest,
		pluginModule: Record<string, unknown>,
	): Promise<void> {
		const plugin = this.loadedPlugins.get(pluginId);
		if (!plugin) return;

		try {
			// Load GraphQL extensions
			if (manifest.extensionPoints?.graphql) {
				for (const extension of manifest.extensionPoints.graphql) {
					try {
						await this.loadGraphQLExtension(pluginId, extension, pluginModule);
					} catch (error) {
						console.error(
							`Failed to load GraphQL extension ${extension.name} for plugin ${pluginId}:`,
							error,
						);
						throw error;
					}
				}
			}

			// Load Database extensions (no logging)
			if (manifest.extensionPoints?.database) {
				for (const extension of manifest.extensionPoints.database) {
					await this.loadDatabaseExtension(pluginId, extension, pluginModule);
				}
			}

			// Load Hook extensions (no logging)
			if (manifest.extensionPoints?.hooks) {
				for (const extension of manifest.extensionPoints.hooks) {
					await this.loadHookExtension(pluginId, extension, pluginModule);
				}
			}
		} catch (error) {
			console.error(
				`Extension points loading failed for plugin ${pluginId}:`,
				error,
			);
			throw new Error(
				`Failed to load extension points: ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
		}
	}

	/**
	 * Load GraphQL extension
	 */
	private async loadGraphQLExtension(
		pluginId: string,
		extension: IGraphQLExtension,
		pluginModule: Record<string, unknown>,
	): Promise<void> {
		let resolver: unknown;

		// Load GraphQL resolver

		// If extension specifies a file, load from that file directly
		if (extension.file) {
			const pluginPath = path.join(this.pluginsDirectory, pluginId);
			const extensionFilePath = path.join(pluginPath, extension.file);

			// Load resolver from dedicated file

			try {
				const extensionModule = await safeRequire(extensionFilePath);
				if (!extensionModule) {
					throw new Error(
						`Failed to load GraphQL extension file: ${extension.file}`,
					);
				}

				resolver = (extensionModule as Record<string, unknown>)[
					extension.resolver
				];

				// Resolver loaded successfully
			} catch (error) {
				throw new Error(
					`Failed to load GraphQL extension from ${extension.file}: ${error}`,
				);
			}
		} else {
			// Load from main plugin module
			resolver = pluginModule[extension.resolver];
		}

		if (!resolver) {
			throw new Error(
				`GraphQL resolver '${extension.resolver}' not found in plugin ${pluginId}`,
			);
		}

		// Re-fetch plugin object to ensure we have the latest reference
		const plugin = this.loadedPlugins.get(pluginId);
		if (!plugin) {
			throw new Error(`Plugin ${pluginId} not found in loaded plugins`);
		}

		// Initialize graphqlResolvers if needed
		if (
			!plugin.graphqlResolvers ||
			typeof plugin.graphqlResolvers !== "object"
		) {
			plugin.graphqlResolvers = {};
		}

		// Assign resolver to plugin
		plugin.graphqlResolvers[extension.name] = resolver;

		// Register in extension registry
		this.extensionRegistry.graphql[
			this.getExtensionRegistryKey(
				extension.type,
				"graphql",
			) as keyof typeof this.extensionRegistry.graphql
		][extension.name] = {
			pluginId,
			resolver,
			name: extension.name,
			type: extension.type,
			file: extension.file,
			description: extension.description,
		};

		// Extension registered successfully
	}

	/**
	 * Load Database extension
	 */
	private async loadDatabaseExtension(
		pluginId: string,
		extension: IDatabaseExtension,
		pluginModule: Record<string, unknown>,
	): Promise<void> {
		let tableDefinition: unknown;

		// If extension specifies a file, load from that file directly
		if (extension.file) {
			const pluginPath = path.join(this.pluginsDirectory, pluginId);
			const extensionFilePath = path.join(pluginPath, extension.file);

			try {
				const extensionModule = await safeRequire(extensionFilePath);
				if (!extensionModule) {
					throw new Error(`Failed to load extension file: ${extension.file}`);
				}

				tableDefinition = (extensionModule as Record<string, unknown>)[
					extension.name
				];
			} catch (error) {
				throw new Error(
					`Failed to load database extension from ${extension.file}: ${error}`,
				);
			}
		} else {
			// Fallback: try to get from main plugin module
			tableDefinition = pluginModule[extension.name];
		}

		if (!tableDefinition) {
			throw new Error(
				`Database table '${extension.name}' not found in plugin ${pluginId}`,
			);
		}

		const plugin = this.loadedPlugins.get(pluginId);
		if (!plugin) {
			throw new Error(`Plugin ${pluginId} not found in loaded plugins`);
		}

		// Ensure databaseTables is initialized
		if (!plugin.databaseTables) {
			plugin.databaseTables = {} as Record<string, Record<string, unknown>>;
		}

		(plugin.databaseTables as Record<string, Record<string, unknown>>)[
			extension.name
		] = tableDefinition as Record<string, unknown>;

		// Register in extension registry
		this.extensionRegistry.database[
			this.getExtensionRegistryKey(
				extension.type,
				"database",
			) as keyof typeof this.extensionRegistry.database
		][extension.name] = {
			pluginId,
			definition: tableDefinition,
			...extension,
		};
	}

	/**
	 * Load Hook extension
	 */
	private async loadHookExtension(
		pluginId: string,
		extension: IHookExtension,
		pluginModule: Record<string, unknown>,
	): Promise<void> {
		let handler: unknown;

		// If extension specifies a file, load from that file directly
		if (extension.file) {
			const pluginPath = path.join(this.pluginsDirectory, pluginId);
			const extensionFilePath = path.join(pluginPath, extension.file);

			try {
				const extensionModule = await safeRequire(extensionFilePath);
				if (!extensionModule) {
					throw new Error(
						`Failed to load hook extension file: ${extension.file}`,
					);
				}

				handler = (extensionModule as Record<string, unknown>)[
					extension.handler
				];
			} catch (error) {
				throw new Error(
					`Failed to load hook extension from ${extension.file}: ${error}`,
				);
			}
		} else {
			// Fallback: try to get from main plugin module
			handler = pluginModule[extension.handler];
		}

		if (!handler || typeof handler !== "function") {
			throw new Error(
				`Hook handler '${extension.handler}' not found or not a function in plugin ${pluginId}`,
			);
		}

		const plugin = this.loadedPlugins.get(pluginId);
		if (!plugin) {
			throw new Error(`Plugin ${pluginId} not found in loaded plugins`);
		}

		// Ensure hooks is initialized
		if (!plugin.hooks) {
			plugin.hooks = {} as Record<string, (...args: unknown[]) => unknown>;
		}

		plugin.hooks[extension.event] = handler as (...args: unknown[]) => unknown;

		// Register in extension registry
		const hookType = extension.type as "pre" | "post";
		if (!this.extensionRegistry.hooks[hookType][extension.event as string]) {
			this.extensionRegistry.hooks[hookType][extension.event as string] = [];
		}
		const hooks =
			this.extensionRegistry.hooks[hookType][extension.event as string];
		if (hooks) {
			hooks.push(handler as (...args: unknown[]) => unknown);
		}
	}

	/**
	 * Map extension types to their registry keys
	 */
	private getExtensionRegistryKey(
		type: string,
		registryType: "graphql" | "database",
	): string {
		if (registryType === "graphql") {
			switch (type) {
				case "query":
					return "queries";
				case "mutation":
					return "mutations";
				case "subscription":
					return "subscriptions";
				case "type":
					return "types";
				default:
					throw new Error(`Unknown GraphQL extension type: ${type}`);
			}
		}
		if (registryType === "database") {
			switch (type) {
				case "table":
					return "tables";
				case "enum":
					return "enums";
				case "relation":
					return "relations";
				default:
					throw new Error(`Unknown database extension type: ${type}`);
			}
		}
		throw new Error(`Unknown registry type: ${registryType}`);
	}
}
