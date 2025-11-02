/**
 * GraphQL Schema Manager for Dynamic Plugin Integration
 *
 * This manager handles dynamic schema rebuilding when plugins are activated/deactivated
 * without requiring server restarts.
 */

import type { GraphQLSchema } from "graphql";

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
			// Listen for schema rebuild events
			pluginManager.on("schema:rebuild", async (data) => {
				await this.rebuildSchema();
			});

			// Listen for plugin deactivation to remove fields
			pluginManager.on("plugin:deactivated", async (pluginId) => {
				await this.rebuildSchema();
			});
		}
	}

	/**
	 * Build the initial schema
	 */
	async buildInitialSchema(): Promise<GraphQLSchema> {
		// Set up plugin listeners now that we're initializing
		await this.setupPluginListeners();

		// Import and register all core schema components
		await this.importCoreSchema();

		// Register active plugin extensions
		await this.registerActivePluginExtensions();

		// Build the schema
		const schema = builder.toSchema();
		this.currentSchema = schema;

		return schema;
	}

	/**
	 * Dynamically rebuild the GraphQL schema
	 */
	async rebuildSchema(): Promise<GraphQLSchema> {
		if (this.isRebuilding) {
			if (!this.currentSchema) {
				throw new Error("No current schema available during rebuild");
			}
			return this.currentSchema;
		}

		this.isRebuilding = true;

		try {
			// Re-import all core schema components
			await this.importCoreSchema();

			// Register all active plugin extensions
			await this.registerActivePluginExtensions();

			// Build the new schema
			const newSchema = builder.toSchema();
			this.currentSchema = newSchema;

			// Notify all registered callbacks about the schema update
			this.notifySchemaUpdateCallbacks(newSchema);

			return newSchema;
		} catch (error) {
			console.error("Schema rebuild failed:", error);
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
		} catch (error) {
			console.error("Core schema import failed:", error);
			throw error;
		}
	}

	/**
	 * Register GraphQL extensions from all active plugins
	 */
	private async registerActivePluginExtensions(): Promise<void> {
		const pluginManager = getPluginManagerInstance();
		if (!pluginManager || !pluginManager.isSystemInitialized()) {
			console.log("Plugin Manager Not Available or Not Initialized");
			return;
		}

		const extensionRegistry = pluginManager.getExtensionRegistry();

		// Check if there are any plugins loaded
		const loadedPlugins = pluginManager.getLoadedPlugins();
		if (loadedPlugins.length === 0) {
			console.log("No plugins loaded, skipping plugin extension registration");
			return;
		}

		// Register queries
		for (const [queryName, queryExtension] of Object.entries(
			extensionRegistry.graphql.queries,
		) as [
			string,
			{
				pluginId: string;
				resolver: (parent: unknown, args: unknown, context: unknown) => unknown;
			},
		][]) {
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
		) as [
			string,
			{
				pluginId: string;
				resolver: (parent: unknown, args: unknown, context: unknown) => unknown;
			},
		][]) {
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
		) as [
			string,
			{
				pluginId: string;
				resolver: (parent: unknown, args: unknown, context: unknown) => unknown;
			},
		][]) {
			if (pluginManager.isPluginActive(subscriptionExtension.pluginId)) {
				this.registerGraphQLField(
					subscriptionExtension.pluginId,
					"subscription",
					subscriptionName,
					subscriptionExtension,
				);
			}
		}

		// Plugin extensions registered successfully
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
			console.error(
				`Failed to register plugin GraphQL field ${pluginId}.${fieldName}:`,
				error,
			);
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
				console.error("Schema update callback failed:", error);
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
export { GraphQLSchemaManager };
