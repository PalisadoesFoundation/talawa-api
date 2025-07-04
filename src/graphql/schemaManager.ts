/**
 * GraphQL Schema Manager for Dynamic Plugin Integration
 *
 * This manager handles dynamic schema rebuilding when plugins are activated/deactivated
 * without requiring server restarts.
 */

import type { GraphQLSchema } from "graphql";
import { pluginLogger } from "~/src/plugin/logger";
import { getPluginManagerInstance } from "~/src/plugin/registry";
import { builder } from "./builder";

class GraphQLSchemaManager {
	private currentSchema: GraphQLSchema | null = null;
	private isRebuilding = false;
	private schemaUpdateCallbacks: Array<(schema: GraphQLSchema) => void> = [];

	/**
	 * Setup listeners for plugin events that require schema rebuilds
	 */
	private async setupPluginListeners(): Promise<void> {
		const pluginManager = getPluginManagerInstance();
		if (pluginManager) {
			await pluginLogger.info("🔗 Setting up Schema Manager Plugin Listeners", {
				hasPluginManager: !!pluginManager,
				pluginManagerInitialized: pluginManager.isSystemInitialized(),
			});

			// Listen for schema rebuild events
			pluginManager.on("schema:rebuild", async (data) => {
				await pluginLogger.info("🔄 Schema Rebuild Triggered", {
					pluginId: data.pluginId,
					reason: data.reason,
					timestamp: data.timestamp,
				});
				await this.rebuildSchema();
			});

			// Listen for plugin deactivation to remove fields
			pluginManager.on("plugin:deactivated", async (pluginId) => {
				await pluginLogger.info("🔄 Schema Rebuild for Plugin Deactivation", {
					pluginId,
					reason: "plugin_deactivation",
				});
				await this.rebuildSchema();
			});

			await pluginLogger.info(
				"✅ Schema Manager Plugin Listeners Setup Complete",
			);
		} else {
			await pluginLogger.warn(
				"⚠️ Plugin Manager Not Available for Schema Listeners",
				{
					retryStrategy: "will_setup_during_initial_build",
				},
			);
		}
	}

	/**
	 * Build the initial schema
	 */
	async buildInitialSchema(): Promise<GraphQLSchema> {
		await pluginLogger.info("🏗️ Building Initial GraphQL Schema", {
			timestamp: new Date().toISOString(),
		});

		// Set up plugin listeners now that we're initializing
		await this.setupPluginListeners();

		// Import and register all core schema components
		await this.importCoreSchema();

		// Register active plugin extensions
		await this.registerActivePluginExtensions();

		// Build the schema
		const schema = builder.toSchema();
		this.currentSchema = schema;

		await pluginLogger.info("✅ Initial GraphQL Schema Built", {
			schemaFields: {
				queries: Object.keys(schema.getQueryType()?.getFields() || {}),
				mutations: Object.keys(schema.getMutationType()?.getFields() || {}),
				subscriptions: Object.keys(
					schema.getSubscriptionType()?.getFields() || {},
				),
			},
			timestamp: new Date().toISOString(),
		});

		return schema;
	}

	/**
	 * Dynamically rebuild the GraphQL schema
	 */
	async rebuildSchema(): Promise<GraphQLSchema> {
		if (this.isRebuilding) {
			await pluginLogger.info("⏳ Schema Rebuild Already In Progress", {
				action: "skipping_duplicate_rebuild",
			});
			if (!this.currentSchema) {
				throw new Error("No current schema available during rebuild");
			}
			return this.currentSchema;
		}

		this.isRebuilding = true;

		try {
			await pluginLogger.info("🔧 Starting Dynamic Schema Rebuild", {
				timestamp: new Date().toISOString(),
				currentSchemaExists: !!this.currentSchema,
			});

			// Use the main builder instance (builders maintain global state)

			// Re-import all core schema components
			await this.importCoreSchema();

			// Register all active plugin extensions
			await this.registerActivePluginExtensions();

			// Build the new schema
			const newSchema = builder.toSchema();
			this.currentSchema = newSchema;

			await pluginLogger.info("✅ Schema Rebuild Completed", {
				newSchemaFields: {
					queries: Object.keys(newSchema.getQueryType()?.getFields() || {}),
					mutations: Object.keys(
						newSchema.getMutationType()?.getFields() || {},
					),
					subscriptions: Object.keys(
						newSchema.getSubscriptionType()?.getFields() || {},
					),
				},
				timestamp: new Date().toISOString(),
			});

			// Notify all registered callbacks about the schema update
			this.notifySchemaUpdateCallbacks(newSchema);

			return newSchema;
		} catch (error) {
			await pluginLogger.error("❌ Schema Rebuild Failed", {
				error:
					error instanceof Error
						? {
								message: error.message,
								stack: error.stack,
								name: error.name,
							}
						: String(error),
				timestamp: new Date().toISOString(),
			});
			throw error;
		} finally {
			this.isRebuilding = false;
		}
	}

	/**
	 * Import all core GraphQL schema components
	 */
	private async importCoreSchema(): Promise<void> {
		try {
			// Import all core schema components in the correct order
			// This ensures the base API schema is always available

			// Import all core schema files - this will register all types with the builder
			await import("./enums/index");
			await import("./scalars/index");
			await import("./inputs/index");
			await import("./types/index");
			// Note: interfaces and unions directories have empty index files, so skipping them

			await pluginLogger.info("📦 Core Schema Components Imported", {
				componentsLoaded: ["enums", "scalars", "inputs", "types"],
			});
		} catch (error) {
			await pluginLogger.error("❌ Core Schema Import Failed", {
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	/**
	 * Register GraphQL extensions from all active plugins
	 */
	private async registerActivePluginExtensions(): Promise<void> {
		const pluginManager = getPluginManagerInstance();
		if (!pluginManager) {
			await pluginLogger.warn("Plugin Manager Not Available", {
				action: "skipping_plugin_extensions",
			});
			return;
		}

		const activePlugins = pluginManager.getActivePlugins();
		await pluginLogger.info("🔌 Registering Active Plugin Extensions", {
			activePluginCount: activePlugins.length,
			activePluginIds: activePlugins.map((p) => p.id),
		});

		const extensionRegistry = pluginManager.getExtensionRegistry();

		// Register queries
		for (const [queryName, queryExtension] of Object.entries(
			extensionRegistry.graphql.queries,
		)) {
			if (pluginManager.isPluginActive(queryExtension.pluginId)) {
				this.registerGraphQLField(
					queryExtension.pluginId,
					"query",
					queryName,
					queryExtension,
				);
			}
		}

		// Register mutations
		for (const [mutationName, mutationExtension] of Object.entries(
			extensionRegistry.graphql.mutations,
		)) {
			if (pluginManager.isPluginActive(mutationExtension.pluginId)) {
				this.registerGraphQLField(
					mutationExtension.pluginId,
					"mutation",
					mutationName,
					mutationExtension,
				);
			}
		}

		// Register subscriptions
		for (const [subscriptionName, subscriptionExtension] of Object.entries(
			extensionRegistry.graphql.subscriptions,
		)) {
			if (pluginManager.isPluginActive(subscriptionExtension.pluginId)) {
				this.registerGraphQLField(
					subscriptionExtension.pluginId,
					"subscription",
					subscriptionName,
					subscriptionExtension,
				);
			}
		}

		await pluginLogger.info("✅ Plugin Extensions Registered", {
			totalQueries: Object.keys(extensionRegistry.graphql.queries).length,
			totalMutations: Object.keys(extensionRegistry.graphql.mutations).length,
			totalSubscriptions: Object.keys(extensionRegistry.graphql.subscriptions)
				.length,
		});
	}

	/**
	 * Register a GraphQL field from a plugin
	 */
	private registerGraphQLField(
		pluginId: string,
		type: "query" | "mutation" | "subscription",
		fieldName: string,
		extension: {
			pluginId: string;
			resolver: (parent: unknown, args: unknown, context: unknown) => unknown;
		},
	): void {
		const namespacedFieldName = `${pluginId}_${fieldName}`;

		try {
			if (type === "query") {
				builder.queryField(namespacedFieldName, (t) =>
					t.string({
						description: `Plugin ${pluginId} query: ${fieldName}`,
						resolve: async (parent, args, ctx) => {
							await pluginLogger.info("⚡ Executing Plugin GraphQL Query", {
								pluginId,
								queryName: fieldName,
								namespacedFieldName,
								timestamp: new Date().toISOString(),
							});

							// Create plugin context from the main GraphQL context
							const pluginContext = {
								db: ctx.drizzleClient,
								graphql: null,
								pubsub: ctx.pubsub,
								logger: ctx.log,
								currentClient: ctx.currentClient,
								drizzleClient: ctx.drizzleClient,
								envConfig: ctx.envConfig,
								jwt: ctx.jwt,
								log: ctx.log,
								minio: ctx.minio,
							};

							const result = await extension.resolver(
								parent,
								args,
								pluginContext,
							);
							return JSON.stringify(result);
						},
					}),
				);
			} else if (type === "mutation") {
				builder.mutationField(namespacedFieldName, (t) =>
					t.string({
						description: `Plugin ${pluginId} mutation: ${fieldName}`,
						args: {
							input: t.arg.string({
								required: false,
								description: `Input for ${pluginId} ${fieldName} mutation`,
							}),
						},
						resolve: async (parent, args, ctx) => {
							await pluginLogger.info("⚡ Executing Plugin GraphQL Mutation", {
								pluginId,
								mutationName: fieldName,
								namespacedFieldName,
								timestamp: new Date().toISOString(),
							});

							// Parse input if provided and structure it properly for plugin resolvers
							let formattedArgs = {};
							if (args.input && args.input !== null) {
								try {
									const parsedInput = JSON.parse(args.input);
									// Plugin resolvers expect args.input structure
									formattedArgs = { input: parsedInput };
								} catch (error) {
									throw new Error(`Invalid JSON input: ${error}`);
								}
							}

							// Create plugin context from the main GraphQL context
							const pluginContext = {
								db: ctx.drizzleClient,
								graphql: null,
								pubsub: ctx.pubsub,
								logger: ctx.log,
								currentClient: ctx.currentClient,
								drizzleClient: ctx.drizzleClient,
								envConfig: ctx.envConfig,
								jwt: ctx.jwt,
								log: ctx.log,
								minio: ctx.minio,
							};

							const result = await extension.resolver(
								parent,
								formattedArgs,
								pluginContext,
							);
							return JSON.stringify(result);
						},
					}),
				);
			} else if (type === "subscription") {
				builder.subscriptionField(namespacedFieldName, (t) =>
					t.string({
						description: `Plugin ${pluginId} subscription: ${fieldName}`,
						subscribe: async () => {
							async function* subscriptionGenerator() {
								yield "Plugin subscription placeholder";
							}
							return subscriptionGenerator();
						},
						resolve: async (parent, args, ctx) => {
							await pluginLogger.info(
								"⚡ Executing Plugin GraphQL Subscription",
								{
									pluginId,
									subscriptionName: fieldName,
									namespacedFieldName,
									timestamp: new Date().toISOString(),
								},
							);

							// Create plugin context from the main GraphQL context
							const pluginContext = {
								db: ctx.drizzleClient,
								graphql: null,
								pubsub: ctx.pubsub,
								logger: ctx.log,
								currentClient: ctx.currentClient,
								drizzleClient: ctx.drizzleClient,
								envConfig: ctx.envConfig,
								jwt: ctx.jwt,
								log: ctx.log,
								minio: ctx.minio,
							};

							const result = await extension.resolver(
								parent,
								args,
								pluginContext,
							);
							return JSON.stringify(result);
						},
					}),
				);
			}
		} catch (error) {
			pluginLogger.error("❌ Failed to Register Plugin GraphQL Field", {
				pluginId,
				fieldType: type,
				fieldName,
				namespacedFieldName,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	/**
	 * Register a callback to be notified when the schema is updated
	 */
	onSchemaUpdate(callback: (schema: GraphQLSchema) => void): void {
		this.schemaUpdateCallbacks.push(callback);
	}

	/**
	 * Remove a schema update callback
	 */
	removeSchemaUpdateCallback(callback: (schema: GraphQLSchema) => void): void {
		this.schemaUpdateCallbacks = this.schemaUpdateCallbacks.filter(
			(cb) => cb !== callback,
		);
	}

	/**
	 * Notify all registered callbacks about schema updates
	 */
	private notifySchemaUpdateCallbacks(schema: GraphQLSchema): void {
		for (const callback of this.schemaUpdateCallbacks) {
			try {
				callback(schema);
			} catch (error) {
				pluginLogger.error("❌ Schema Update Callback Failed", {
					error: error instanceof Error ? error.message : String(error),
				});
			}
		}
	}

	/**
	 * Get the current schema
	 */
	getCurrentSchema(): GraphQLSchema | null {
		return this.currentSchema;
	}
}

// Export singleton instance
export const schemaManager = new GraphQLSchemaManager();
export default schemaManager;
