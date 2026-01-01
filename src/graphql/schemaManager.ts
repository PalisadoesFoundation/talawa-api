/**
 * GraphQL Schema Manager for Dynamic Plugin Integration
 *
 * This manager handles dynamic schema rebuilding when plugins are activated/deactivated
 * without requiring server restarts.
 */

import path from "node:path";
import type { FastifyBaseLogger } from "fastify";
import type { GraphQLSchema } from "graphql";

import { builder } from "~/src/graphql/builder";
import { getPluginManagerInstance } from "~/src/plugin/registry";
import type { IExtensionRegistry } from "~/src/plugin/types";

class GraphQLSchemaManager {
	private currentSchema: GraphQLSchema | null = null;
	private isRebuilding = false;
	private schemaUpdateCallbacks: Array<(schema: GraphQLSchema) => void> = [];
	private logger: FastifyBaseLogger | null = null;

	/**
	 * Set the logger instance
	 */
	setLogger(logger: FastifyBaseLogger): void {
		this.logger = logger;
	}

	/**
	 * Setup listeners for plugin events that require schema rebuilds
	 */
	private async setupPluginListeners(): Promise<void> {
		const pluginManager = getPluginManagerInstance();
		if (pluginManager) {
			// Listen for schema rebuild events
			pluginManager.on("schema:rebuild", async (_data) => {
				await this.rebuildSchema();
			});

			// Listen for plugin deactivation to remove fields
			pluginManager.on("plugin:deactivated", async (_pluginId) => {
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
			this.logger?.error({ error }, "Schema rebuild failed");
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
			await import("./scalars/index");
			await import("./enums/index");
			await import("./inputs/index");
			await import("./types/index");
			// Note: interfaces and unions directories have empty index files, so skipping them
		} catch (error) {
			this.logger?.error({ error }, "Core schema import failed");
			throw error;
		}
	}

	/**
	 * Register GraphQL extensions from all active plugins
	 */
	private async registerActivePluginExtensions(): Promise<void> {
		const pluginManager = getPluginManagerInstance();
		if (!pluginManager || !pluginManager.isSystemInitialized()) {
			this.logger?.info("Plugin Manager Not Available or Not Initialized");
			return;
		}

		const extensionRegistry = pluginManager.getExtensionRegistry();

		// Check if there are any plugins loaded
		const loadedPlugins = pluginManager.getLoadedPlugins();
		if (loadedPlugins.length === 0) {
			this.logger?.info(
				"No plugins loaded, skipping plugin extension registration",
			);
			return;
		}

		// Register builder-first extensions
		await this.registerBuilderExtensions(extensionRegistry);
	}

	/**
	 * Register builder-first GraphQL extensions using Pothos builder
	 */
	private async registerBuilderExtensions(
		extensionRegistry: IExtensionRegistry,
	): Promise<void> {
		const pluginManager = getPluginManagerInstance();
		if (!pluginManager) return;

		const builderExtensions = extensionRegistry.graphql.builderExtensions || [];

		for (const extension of builderExtensions) {
			if (pluginManager.isPluginActive(extension.pluginId)) {
				try {
					// Import plugin types first to ensure they're registered with the builder
					const pluginsDirectory = pluginManager.getPluginsDirectory();
					const pluginPath = path.join(pluginsDirectory, extension.pluginId);

					try {
						// Import the plugin's types file if it exists
						await import(`${pluginPath}/graphql/types`);
					} catch (_error) {
						// Plugin types file doesn't exist, continue without it
						this.logger?.info(
							{ pluginId: extension.pluginId },
							"No types file found for plugin",
						);
					}

					// Create a namespaced builder wrapper that automatically prefixes field names
					const namespacedBuilder = this.createNamespacedBuilder(
						extension.pluginId,
						builder,
					);

					// Execute the builder function with the namespaced builder
					extension.builderFunction(namespacedBuilder);
					this.logger?.info(
						{
							pluginId: extension.pluginId,
							fieldName: extension.fieldName,
						},
						"Registered builder extension",
					);
				} catch (error) {
					this.logger?.error(
						{
							error,
							pluginId: extension.pluginId,
							fieldName: extension.fieldName,
						},
						"Failed to register builder extension",
					);
				}
			}
		}
	}

	/**
	 * Create a namespaced builder that automatically prefixes field names with plugin ID
	 */
	private createNamespacedBuilder(
		pluginId: string,
		originalBuilder: typeof builder,
	): {
		queryField: typeof builder.queryField;
		mutationField: typeof builder.mutationField;
		subscriptionField: typeof builder.subscriptionField;
	} {
		return {
			queryField: (
				fieldName: string,
				fieldConfig: Parameters<typeof builder.queryField>[1],
			) => {
				const namespacedFieldName = `${pluginId}_${fieldName}`;
				return originalBuilder.queryField(namespacedFieldName, fieldConfig);
			},
			mutationField: (
				fieldName: string,
				fieldConfig: Parameters<typeof builder.mutationField>[1],
			) => {
				const namespacedFieldName = `${pluginId}_${fieldName}`;
				return originalBuilder.mutationField(namespacedFieldName, fieldConfig);
			},
			subscriptionField: (
				fieldName: string,
				fieldConfig: Parameters<typeof builder.subscriptionField>[1],
			) => {
				const namespacedFieldName = `${pluginId}_${fieldName}`;
				return originalBuilder.subscriptionField(
					namespacedFieldName,
					fieldConfig,
				);
			},
		};
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
				this.logger?.error({ error }, "Schema update callback failed");
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
