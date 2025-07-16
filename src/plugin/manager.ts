/**
 * Plugin Manager for Talawa API
 *
 * This is the core plugin management system that handles discovery, loading,
 * activation, and lifecycle management of plugins in the Talawa API.
 */

import { EventEmitter } from "node:events";
import path from "node:path";
import { eq } from "drizzle-orm";
import { pluginsTable } from "~/src/drizzle/tables/plugins";

import type {
	IDatabaseClient,
	IDatabaseExtension,
	IExtensionRegistry,
	IGraphQLExtension,
	IHookExtension,
	ILoadedPlugin,
	IPluginContext,
	IPluginError,
	IPluginLifecycle,
	IPluginManifest,
} from "./types";
import { PluginStatus } from "./types";
import {
	directoryExists,
	dropPluginTables,
	isValidPluginId,
	loadPluginManifest,
	safeRequire,
} from "./utils";

class PluginManager extends EventEmitter {
	private loadedPlugins: Map<string, ILoadedPlugin> = new Map();
	private extensionRegistry: IExtensionRegistry = {
		graphql: {
			queries: {},
			mutations: {},
			subscriptions: {},
			types: {},
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
	};
	private pluginContext: IPluginContext;
	private pluginsDirectory: string;
	private isInitialized = false;
	private errors: IPluginError[] = [];

	constructor(context: IPluginContext, pluginsDir?: string) {
		super();
		this.pluginContext = context;
		this.pluginsDirectory =
			pluginsDir || path.join(process.cwd(), "src", "plugin", "available");

		console.log("PluginManager constructor called");

		this.initializePlugins().catch((error) => {
			console.error("Failed to initialize plugin system:", error);
		});
	}

	/**
	 * Initialize the plugin system
	 */
	private async initializePlugins(): Promise<void> {
		console.log("INIT_START", "system");

		try {
			this.emit("plugins:initializing");

			// Ensure plugins directory exists (create if needed)
			const pluginsDirExists = await directoryExists(this.pluginsDirectory);
			console.log("Plugins directory exists check", {
				directory: this.pluginsDirectory,
				exists: pluginsDirExists,
			});

			if (!pluginsDirExists) {
				console.log(`Creating plugins directory: ${this.pluginsDirectory}`);
				console.log("Creating plugins directory", {
					directory: this.pluginsDirectory,
				});
				try {
					await import("node:fs/promises").then((fs) =>
						fs.mkdir(this.pluginsDirectory, { recursive: true }),
					);
				} catch (error) {
					console.error("Failed to create plugins directory:", error);
					console.error("Failed to create plugins directory", error);
				}
			}

			// Get installed plugins from database (DATABASE IS SOURCE OF TRUTH)
			const installedPlugins = await this.getInstalledPlugins();
			console.log("Database-based plugin initialization", {
				installedPluginCount: installedPlugins.length,
				installedPlugins: installedPlugins.map((p) => ({
					id: p.pluginId,
					activated: p.isActivated,
					installed: p.isInstalled,
				})),
			});

			if (installedPlugins.length === 0) {
				console.log("No plugins installed in database");
				console.log("No plugins installed in database");
				this.markAsInitialized();
				return;
			}

			// Load each installed plugin directly from database
			const loadResults = await Promise.allSettled(
				installedPlugins.map(async (dbPlugin) => {
					try {
						console.log("Loading plugin from database", {
							pluginId: dbPlugin.pluginId,
							isActivated: dbPlugin.isActivated,
							isInstalled: dbPlugin.isInstalled,
						});

						const success = await this.loadPlugin(dbPlugin.pluginId);
						if (success) {
							console.log("Plugin loaded successfully", {
								pluginId: dbPlugin.pluginId,
							});
						} else {
							console.log("Plugin failed to load", {
								pluginId: dbPlugin.pluginId,
							});
						}
						return { pluginId: dbPlugin.pluginId, success };
					} catch (error) {
						console.error(`Failed to load plugin ${dbPlugin.pluginId}`, error);
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

			console.log("Plugin initialization completed", {
				totalPlugins: installedPlugins.length,
				successful,
				failed,
				loadedPlugins: this.getLoadedPluginIds(),
			});

			this.markAsInitialized();
			this.emit("plugins:initialized", this.getLoadedPluginIds());
			console.log("INIT_COMPLETE", "system", {
				loadedPlugins: this.getLoadedPluginIds(),
				summary: { total: installedPlugins.length, successful, failed },
			});
		} catch (error) {
			console.error("Failed to initialize plugins:", error);
			console.error("Failed to initialize plugins", error);
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
			console.error("Error fetching installed plugins from database:", error);
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
				console.warn(`Plugin ${pluginId} is already loaded`);
				return true;
			}

			// Check if plugin files exist
			const pluginPath = path.join(this.pluginsDirectory, pluginId);
			const manifestPath = path.join(pluginPath, "manifest.json");

			try {
				await import("node:fs/promises").then((fs) => fs.access(manifestPath));
			} catch (error) {
				console.log("Plugin files not found", {
					pluginId,
					pluginPath,
					manifestPath,
					message:
						"Plugin is in database but files are missing. This could happen if files were deleted manually.",
				});
				console.warn(
					`Plugin ${pluginId} is in database but files are missing at ${pluginPath}`,
				);
				return false;
			}

			// Load plugin manifest
			let manifest: IPluginManifest;
			try {
				manifest = await loadPluginManifest(pluginPath);
				console.log("Plugin manifest loaded", {
					pluginId,
					manifestPath,
					manifest,
				});
			} catch (error) {
				console.error("Failed to load plugin manifest", {
					pluginId,
					manifestPath,
					error: error instanceof Error ? error.message : String(error),
				});
				console.error(`Failed to load manifest for plugin ${pluginId}:`, error);
				return false;
			}

			// Load plugin module
			let pluginModule: Record<string, unknown>;
			try {
				pluginModule = await this.loadPluginModule(pluginPath, manifest);
				console.log("Plugin module loaded", {
					pluginId,
					mainFile: manifest.main,
				});
			} catch (error) {
				console.error("Failed to load plugin module", {
					pluginId,
					mainFile: manifest.main,
					error: error instanceof Error ? error.message : String(error),
				});
				console.error(`Failed to load module for plugin ${pluginId}:`, error);
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
				status: PluginStatus.LOADING,
			};

			this.loadedPlugins.set(pluginId, loadedPlugin);

			// Load extension points into memory (database tables already created by createPlugin mutation)
			try {
				await this.loadExtensionPoints(pluginId, manifest, pluginModule);
				console.log("Plugin extension points loaded", {
					pluginId,
				});
			} catch (error) {
				console.error("Failed to load extension points", {
					pluginId,
					error: error instanceof Error ? error.message : String(error),
				});
				// Remove from loaded plugins if extension loading fails
				this.loadedPlugins.delete(pluginId);
				console.error(
					`Failed to load extension points for plugin ${pluginId}:`,
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
					console.log("Plugin activated during load", {
						pluginId,
					});
				} catch (error) {
					console.error("Failed to activate plugin during load", {
						pluginId,
						error: error instanceof Error ? error.message : String(error),
					});
					// Don't return false here - plugin is loaded but not activated
					console.error(
						`Failed to activate plugin ${pluginId} during load:`,
						error,
					);
				}
			}

			this.emit("plugin:loaded", pluginId);
			return true;
		} catch (error) {
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
	 * Load extension points for a plugin
	 */
	private async loadExtensionPoints(
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
	 * Activate a plugin
	 */
	public async activatePlugin(pluginId: string): Promise<boolean> {
		const plugin = this.loadedPlugins.get(pluginId);
		if (!plugin) {
			throw new Error(`Plugin ${pluginId} is not loaded`);
		}

		try {
			this.emit("plugin:activating", pluginId);

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

			this.emit("plugin:activated", pluginId);
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
		this.emit("schema:rebuild", {
			pluginId,
			reason: "plugin_activation",
			timestamp: new Date().toISOString(),
		});

		// Also try to trigger schema rebuild directly as a fallback
		try {
			const { schemaManager } = await import("../graphql/schemaManager");
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
			this.emit("plugin:deactivating", pluginId);

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

			this.emit("plugin:deactivated", pluginId);
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
	public async unloadPlugin(pluginId: string): Promise<boolean> {
		const plugin = this.loadedPlugins.get(pluginId);
		if (!plugin) {
			return true; // Already unloaded
		}

		try {
			this.emit("plugin:unloading", pluginId);

			// Deactivate first if active
			if (plugin.status === PluginStatus.ACTIVE) {
				await this.deactivatePlugin(pluginId);
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

			this.emit("plugin:unloaded", pluginId);
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
			// Emit the schema rebuild event
			this.emit("schema:rebuild", {
				pluginId,
				reason: "plugin_deactivation",
				timestamp: new Date().toISOString(),
			});

			// Also try to trigger schema rebuild directly as a fallback
			const { schemaManager } = await import("../graphql/schemaManager");
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

		const pluginPath = path.join(this.pluginsDirectory, pluginId);
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
	 * Get plugin from database
	 */
	private async getPluginFromDatabase(
		pluginId: string,
	): Promise<typeof pluginsTable.$inferSelect | null> {
		try {
			const queryBuilder = (this.pluginContext.db as IDatabaseClient)
				.select()
				.from(pluginsTable);
			const results = (await queryBuilder.where(
				eq(pluginsTable.pluginId, pluginId),
			)) as Array<typeof pluginsTable.$inferSelect>;

			return results[0] || null;
		} catch (error) {
			console.error("Error fetching plugin from database:", error);
			return null;
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
					console.error(`Error executing post hook for event ${event}:`, error);
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

export default PluginManager;
