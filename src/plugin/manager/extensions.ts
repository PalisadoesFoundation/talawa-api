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
			// Load GraphQL extensions with detailed logging
			if (manifest.extensionPoints?.graphql) {
				console.log("🔥 GraphQL Extension Discovery", {
					pluginId,
					totalExtensions: manifest.extensionPoints.graphql.length,
					extensionTypes: manifest.extensionPoints.graphql.map(
						(ext) => ext.type,
					),
					extensionNames: manifest.extensionPoints.graphql.map(
						(ext) => ext.name,
					),
					manifestStructure: manifest.extensionPoints.graphql,
				});

				for (const extension of manifest.extensionPoints.graphql) {
					try {
						console.log("⚡ Loading GraphQL Extension", {
							pluginId,
							extensionName: extension.name,
							extensionType: extension.type,
							extensionFile: extension.file,
							extensionResolver: extension.resolver,
							extensionStructure: extension,
						});

						await this.loadGraphQLExtension(pluginId, extension, pluginModule);

						console.log("✅ GraphQL Extension Loaded", {
							pluginId,
							extensionName: extension.name,
							extensionType: extension.type,
							success: true,
						});
					} catch (error) {
						console.error("❌ GraphQL Extension Load Failed", {
							pluginId,
							extensionName: extension.name,
							extensionType: extension.type,
							extensionFile: extension.file,
							extensionResolver: extension.resolver,
							error:
								error instanceof Error
									? {
											message: error.message,
											stack: error.stack,
											name: error.name,
										}
									: String(error),
							failureReason: "Extension loading process failed",
						});
						throw error;
					}
				}

				console.log("🎯 GraphQL Extensions Summary", {
					pluginId,
					totalLoaded: manifest.extensionPoints.graphql.length,
					loadedExtensions: manifest.extensionPoints.graphql.map((ext) => ({
						name: ext.name,
						type: ext.type,
						file: ext.file,
					})),
				});
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
			console.error("🚨 Extension Points Loading Failed", {
				pluginId,
				error:
					error instanceof Error
						? {
								message: error.message,
								stack: error.stack,
								name: error.name,
							}
						: String(error),
				context: "Extension points loading process failed",
			});
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

		console.log("🔍 GraphQL Resolver Discovery", {
			pluginId,
			extensionName: extension.name,
			extensionType: extension.type,
			resolverName: extension.resolver,
			sourceFile: extension.file || "main module",
			resolverLoadStrategy: extension.file ? "dedicated_file" : "main_module",
			extensionMetadata: {
				name: extension.name,
				type: extension.type,
				resolver: extension.resolver,
				file: extension.file,
				description: extension.description,
			},
		});

		// If extension specifies a file, load from that file directly
		if (extension.file) {
			const pluginPath = path.join(this.pluginsDirectory, pluginId);
			const extensionFilePath = path.join(pluginPath, extension.file);

			console.log("📁 Loading GraphQL Resolver from Dedicated File", {
				pluginId,
				resolverName: extension.resolver,
				filePath: extensionFilePath,
				relativePath: extension.file,
				absolutePath: extensionFilePath,
				loadingMethod: "file_based_resolver",
			});

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

				console.log("📦 GraphQL Extension File Analysis", {
					pluginId,
					filePath: extensionFilePath,
					moduleExports: Object.keys(
						extensionModule as Record<string, unknown>,
					),
					targetResolver: extension.resolver,
					resolverFound:
						extension.resolver in (extensionModule as Record<string, unknown>),
					resolverType: typeof resolver,
					totalExports: Object.keys(extensionModule as Record<string, unknown>)
						.length,
					availableResolvers: Object.keys(
						extensionModule as Record<string, unknown>,
					).filter(
						(key) =>
							typeof (extensionModule as Record<string, unknown>)[key] ===
							"function",
					),
					moduleStructure: extensionModule as Record<string, unknown>,
				});
			} catch (error) {
				console.error("❌ GraphQL Extension File Load Failed", {
					pluginId,
					filePath: extensionFilePath,
					resolverName: extension.resolver,
					error:
						error instanceof Error
							? {
									message: error.message,
									stack: error.stack,
									name: error.name,
								}
							: error,
					loadingAttempt: "dedicated_file",
					failurePoint: "file_loading_or_parsing",
				});
				throw new Error(
					`Failed to load GraphQL extension from ${extension.file}: ${error}`,
				);
			}
		} else {
			// Fallback: try to get from main plugin module
			resolver = pluginModule[extension.resolver];

			console.log("🏠 Loading GraphQL Resolver from Main Module", {
				pluginId,
				resolverName: extension.resolver,
				mainModuleExports: Object.keys(pluginModule),
				resolverFound: extension.resolver in pluginModule,
				resolverType: typeof resolver,
				loadingMethod: "main_module_resolver",
			});
		}

		if (!resolver) {
			console.error("❌ GraphQL Resolver Not Found", {
				pluginId,
				resolverName: extension.resolver,
				searchedInFile: extension.file || "main module",
				availableResolvers: extension.file
					? "see file analysis above"
					: Object.keys(pluginModule).filter(
							(key) => typeof pluginModule[key] === "function",
						),
				resolutionFailure: true,
				extensionMetadata: extension,
			});
			throw new Error(
				`GraphQL resolver '${extension.resolver}' not found in plugin ${pluginId}`,
			);
		}

		// Re-fetch plugin object to ensure we have the latest reference
		const plugin = this.loadedPlugins.get(pluginId);
		if (!plugin) {
			throw new Error(`Plugin ${pluginId} not found in loaded plugins`);
		}

		console.log("🔧 GraphQL Resolver Registration Process", {
			pluginId,
			extensionName: extension.name,
			extensionType: extension.type,
			resolverFunction: typeof resolver,
			pluginState: {
				hasPlugin: !!plugin,
				hasGraphqlResolvers: !!plugin.graphqlResolvers,
				graphqlResolversType: typeof plugin.graphqlResolvers,
				currentResolvers: Object.keys(plugin.graphqlResolvers || {}),
				pluginKeys: Object.keys(plugin),
			},
			registrationTarget: "plugin_graphql_resolvers",
		});

		// Force re-initialize graphqlResolvers as a completely new object
		if (
			!plugin.graphqlResolvers ||
			typeof plugin.graphqlResolvers !== "object"
		) {
			plugin.graphqlResolvers = {};
			console.log("🔄 GraphQL Resolvers Object Initialized", {
				pluginId,
				action: "force_initialization",
				reason: "graphqlResolvers_was_null_or_not_object",
			});
		}

		// Double-check by re-fetching the plugin again
		const pluginRefresh = this.loadedPlugins.get(pluginId);
		if (!pluginRefresh || !pluginRefresh.graphqlResolvers) {
			console.error("❌ Plugin Object Corruption", {
				pluginId,
				hasPluginRefresh: !!pluginRefresh,
				refreshKeys: pluginRefresh ? Object.keys(pluginRefresh) : "no plugin",
				corruptionType: "plugin_object_invalid",
				expectedStructure: "plugin.graphqlResolvers should be object",
			});
			throw new Error(`Plugin object corrupted for ${pluginId}`);
		}

		try {
			pluginRefresh.graphqlResolvers[extension.name] = resolver;

			console.log("✅ GraphQL Resolver Assigned", {
				pluginId,
				extensionName: extension.name,
				extensionType: extension.type,
				assignmentSuccess: true,
				resolverType: typeof resolver,
				totalResolvers: Object.keys(pluginRefresh.graphqlResolvers).length,
				allResolvers: Object.keys(pluginRefresh.graphqlResolvers),
			});
		} catch (error) {
			console.error("❌ GraphQL Resolver Assignment Failed", {
				pluginId,
				extensionName: extension.name,
				extensionType: extension.type,
				error:
					error instanceof Error
						? {
								message: error.message,
								stack: error.stack,
								name: error.name,
							}
						: error,
				pluginState: {
					hasPlugin: !!pluginRefresh,
					pluginKeys: pluginRefresh ? Object.keys(pluginRefresh) : "no plugin",
					hasGraphqlResolvers: !!pluginRefresh?.graphqlResolvers,
					graphqlResolversType: typeof pluginRefresh?.graphqlResolvers,
					graphqlResolversValue: pluginRefresh?.graphqlResolvers,
				},
				assignmentTarget: extension.name,
				failurePoint: "resolver_assignment",
			});
			throw error;
		}

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

		console.log("🎯 GraphQL Extension Registry Updated", {
			pluginId,
			extensionName: extension.name,
			extensionType: extension.type,
			resolverName: extension.resolver,
			registryKey: this.getExtensionRegistryKey(extension.type, "graphql"),
			registryEntry: {
				pluginId,
				resolverType: typeof resolver,
				...extension,
			},
			registryState: {
				totalQueries: Object.keys(this.extensionRegistry.graphql.queries)
					.length,
				totalMutations: Object.keys(this.extensionRegistry.graphql.mutations)
					.length,
				totalSubscriptions: Object.keys(
					this.extensionRegistry.graphql.subscriptions,
				).length,
				totalTypes: Object.keys(this.extensionRegistry.graphql.types).length,
			},
		});
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
