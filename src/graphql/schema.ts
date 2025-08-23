import { builder } from "./builder";
import "./enums/index";
import "./inputs/index";
import "./interfaces/index";
import "./scalars/index";
import "./types/index";
import "./unions/index";

// Import schema manager for dynamic plugin integration
import { schemaManager } from "./schemaManager";

/**
 * This is the executable graphql schema.
 * The schema manager handles dynamic plugin integration.
 */
export const schema = builder.toSchema({
	sortSchema: true,
});

/**
 * Initialize the schema with plugin integration
 * This should be called during server startup
 */
export async function initializeSchemaWithPlugins() {
	return await schemaManager.buildInitialSchema();
}

/**
 * Get the current schema (with plugins if initialized)
 */
export function getCurrentSchema() {
	return schemaManager.getCurrentSchema() || schema;
}
