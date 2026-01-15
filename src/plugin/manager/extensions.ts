/**
 * Extension Loader for Plugin Manager
 *
 * Handles loading and registration of GraphQL, Database, and Hook extensions
 * from plugins into the extension registry.
 */

import path from "node:path";
import { rootLogger } from "~/src/utilities/logging/logger";
import type {
	IDatabaseExtension,
	IExtensionRegistry,
	IGraphQLBuilderExtension,
	IGraphQLExtension,
	IHookExtension,
	ILoadedPlugin,
	IPluginManifest,
	IWebhookExtension,
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
			// Load GraphQL extensions (builder-first approach only)
			if (manifest.extensionPoints?.graphql) {
				for (const extension of manifest.extensionPoints.graphql) {
					try {
						if (!extension.builderDefinition) {
							throw new Error(
								`Plugin ${pluginId} must use builder-first approach. Missing 'builderDefinition' for extension ${extension.name}`,
							);
						}

						await this.loadBuilderGraphQLExtension(
							pluginId,
							extension,
							pluginModule,
						);
					} catch (error) {
						rootLogger.error(
							{ pluginId, extension: extension.name, err: error },
							"Failed to load GraphQL extension",
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

			// Load Webhook extensions (no logging)
			if (manifest.extensionPoints?.webhooks) {
				for (const extension of manifest.extensionPoints.webhooks) {
					await this.loadWebhookExtension(pluginId, extension, pluginModule);
				}
			}
		} catch (error) {
			rootLogger.error(
				{ pluginId, err: error },
				"Extension points loading failed",
			);
			throw new Error(
				`Failed to load extension points: ${
					error instanceof Error ? error.message : String(error)
				}`,
			);
		}
	}

	/**
	 * Load builder-first GraphQL extension using Pothos builder
	 */
	private async loadBuilderGraphQLExtension(
		pluginId: string,
		extension: IGraphQLExtension,
		pluginModule: Record<string, unknown>,
	): Promise<void> {
		let builderFunction: unknown;

		// Load builder function
		if (extension.file) {
			const pluginPath = path.join(this.pluginsDirectory, pluginId);
			const extensionFilePath = path.join(pluginPath, extension.file);

			try {
				const extensionModule = await safeRequire(extensionFilePath);
				if (!extensionModule) {
					throw new Error(
						`Failed to load GraphQL extension file: ${extension.file}`,
					);
				}

				if (!extension.builderDefinition) {
					throw new Error(
						`Builder definition not specified for extension ${extension.name}`,
					);
				}
				builderFunction = (extensionModule as Record<string, unknown>)[
					extension.builderDefinition
				];
			} catch (error) {
				throw new Error(
					`Failed to load GraphQL builder extension from ${extension.file}: ${error}`,
				);
			}
		} else {
			// Load from main plugin module
			if (!extension.builderDefinition) {
				throw new Error(
					`Builder definition not specified for extension ${extension.name}`,
				);
			}
			builderFunction = pluginModule[extension.builderDefinition];
		}

		if (!builderFunction || typeof builderFunction !== "function") {
			throw new Error(
				`GraphQL builder function '${extension.builderDefinition}' not found or not a function in plugin ${pluginId}`,
			);
		}

		// Register in extension registry as builder extension
		if (!this.extensionRegistry.graphql.builderExtensions) {
			this.extensionRegistry.graphql.builderExtensions = [];
		}

		const builderExtension: IGraphQLBuilderExtension = {
			pluginId,
			type: extension.type,
			fieldName: extension.name,
			builderFunction: builderFunction as (builder: unknown) => void,
			description: extension.description,
		};

		this.extensionRegistry.graphql.builderExtensions.push(builderExtension);

		rootLogger.info(
			{ pluginId, extension: extension.name },
			"Registered builder-first GraphQL extension",
		);
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
		const registryKey = this.getDatabaseExtensionRegistryKey(
			extension.type,
		) as keyof typeof this.extensionRegistry.database;
		this.extensionRegistry.database[registryKey][extension.name] = {
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

	private async loadWebhookExtension(
		pluginId: string,
		extension: IWebhookExtension,
		pluginModule: Record<string, unknown>,
	): Promise<void> {
		// Try to get from main plugin module
		const handler: unknown = pluginModule[extension.handler];

		if (!handler || typeof handler !== "function") {
			throw new Error(
				`Webhook handler '${extension.handler}' not found or not a function in plugin ${pluginId}`,
			);
		}

		const plugin = this.loadedPlugins.get(pluginId);
		if (!plugin) {
			throw new Error(`Plugin ${pluginId} not found in loaded plugins`);
		}

		// Ensure webhooks is initialized
		if (!plugin.webhooks) {
			plugin.webhooks = {} as Record<
				string,
				(request: unknown, reply: unknown) => Promise<unknown>
			>;
		}

		// Create webhook key from plugin ID and path
		const webhookKey = `${pluginId}:${extension.path}`;
		plugin.webhooks[webhookKey] = handler as (
			request: unknown,
			reply: unknown,
		) => Promise<unknown>;

		// Register in extension registry
		this.extensionRegistry.webhooks.handlers[webhookKey] = handler as (
			request: unknown,
			reply: unknown,
		) => Promise<unknown>;

		// Log webhook registration
		rootLogger.info(
			{ pluginId, method: extension.method || "POST", path: extension.path },
			"Webhook registered",
		);
	}

	/**
	 * Map database extension types to their registry keys
	 */
	private getDatabaseExtensionRegistryKey(type: string): string {
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
}
