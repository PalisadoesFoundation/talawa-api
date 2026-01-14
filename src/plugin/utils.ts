/**
 * Utility functions for the Talawa API plugin system
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { rootLogger } from "~/src/utilities/logging/logger";
import type { ILogger, IPluginManifest } from "./types";

/**
 * Validates a plugin manifest structure
 */
export function validatePluginManifest(
	manifest: unknown,
): manifest is IPluginManifest {
	if (!manifest || typeof manifest !== "object" || manifest === null) {
		return false;
	}

	const manifestObj = manifest as Record<string, unknown>;
	const requiredFields = [
		"name",
		"pluginId",
		"version",
		"description",
		"author",
		"main",
	];

	for (const field of requiredFields) {
		if (!manifestObj[field] || typeof manifestObj[field] !== "string") {
			return false;
		}
	}

	// Validate version format (basic semver check)
	const versionRegex = /^\d+\.\d+\.\d+$/;
	if (!versionRegex.test(manifestObj.version as string)) {
		return false;
	}

	// Validate pluginId format (camelCase, PascalCase, or underscore)
	// Must start with a letter, can contain letters, numbers, and underscores
	// No hyphens allowed since plugin IDs will be prefixed to GraphQL queries/mutations
	const pluginIdRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
	if (!pluginIdRegex.test(manifestObj.pluginId as string)) {
		return false;
	}

	return true;
}

/**
 * Generates a unique plugin ID from a plugin name
 */
export function generatePluginId(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9\s_]/g, "")
		.replace(/\s+/g, "_")
		.replace(/_+/g, "_")
		.replace(/^_|_$/g, "");
}

/**
 * Loads a plugin manifest from a file
 */
export async function loadPluginManifest(
	pluginPath: string,
): Promise<IPluginManifest> {
	try {
		const manifestPath = path.join(pluginPath, "manifest.json");
		const manifestContent = await fs.readFile(manifestPath, "utf-8");
		const manifest = JSON.parse(manifestContent);

		if (!validatePluginManifest(manifest)) {
			throw new Error("Invalid manifest format");
		}

		return manifest;
	} catch (error) {
		throw new Error(
			`Failed to load plugin manifest: ${
				error instanceof Error ? error.message : "Unknown error"
			}`,
		);
	}
}

/**
 * Checks if a plugin ID is valid
 */
export function isValidPluginId(pluginId: string): boolean {
	if (!pluginId || typeof pluginId !== "string") {
		return false;
	}

	// Plugin ID should support camelCase, PascalCase, and underscore formats
	// Must start with a letter, can contain letters, numbers, and underscores
	// No hyphens allowed since plugin IDs will be prefixed to GraphQL queries/mutations
	const pluginIdRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
	return pluginIdRegex.test(pluginId);
}

/**
 * Normalizes a file path for dynamic imports
 */
export function normalizeImportPath(
	basePath: string,
	relativePath: string,
): string {
	const fullPath = path.join(basePath, relativePath);
	return fullPath.replace(/\\/g, "/");
}

/**
 * Safely requires a module and handles errors
 */
export async function safeRequire<T = unknown>(
	modulePath: string,
): Promise<T | null> {
	try {
		const module = await import(modulePath);
		return module as T;
	} catch (error) {
		rootLogger.error({
			msg: `Failed to require module: ${modulePath}`,
			err: error,
		});
		return null;
	}
}

/**
 * Checks if a directory exists
 */
export async function directoryExists(dirPath: string): Promise<boolean> {
	try {
		const stat = await fs.stat(dirPath);
		return stat.isDirectory();
	} catch {
		return false;
	}
}

/**
 * Creates a directory if it doesn't exist
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
	try {
		await fs.mkdir(dirPath, { recursive: true });
	} catch (error) {
		throw new Error(
			`Failed to create directory ${dirPath}: ${
				error instanceof Error ? error.message : "Unknown error"
			}`,
		);
	}
}

/**
 * Sorts extension points by priority/order
 */
export function sortExtensionPoints<T extends { order?: number }>(
	items: T[],
): T[] {
	return items.sort((a, b) => (a.order || 0) - (b.order || 0));
}

/**
 * Filters extensions by plugin status
 */
export function filterActiveExtensions<T extends { pluginId: string }>(
	items: T[],
	activePlugins: Set<string>,
): T[] {
	return items.filter((item) => activePlugins.has(item.pluginId));
}

/**
 * Debounces a function call
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
	func: T,
	delay: number,
): (...args: Parameters<T>) => void {
	let timeoutId: NodeJS.Timeout;

	return (...args: Parameters<T>) => {
		clearTimeout(timeoutId);
		timeoutId = setTimeout(() => func(...args), delay);
	};
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
	if (obj === null || typeof obj !== "object") {
		return obj;
	}

	if (obj instanceof Date) {
		return new Date(obj.getTime()) as T;
	}

	if (Array.isArray(obj)) {
		return obj.map((item) => deepClone(item)) as T;
	}

	if (typeof obj === "object") {
		const cloned = {} as T;
		for (const key in obj) {
			if (Object.hasOwn(obj, key)) {
				cloned[key] = deepClone(obj[key]);
			}
		}
		return cloned;
	}

	return obj;
}

/**
 * Converts a Drizzle column type to PostgreSQL SQL type
 */
function drizzleTypeToPostgresType(column: unknown): string {
	const columnType = (column as { columnType?: string }).columnType;

	// Handle different Drizzle column types
	if (columnType === "PgUUID") {
		return "uuid";
	}
	if (columnType === "PgText") {
		return "text";
	}
	if (columnType === "PgInteger") {
		return "integer";
	}
	if (columnType === "PgBigInt") {
		return "bigint";
	}
	if (columnType === "PgBoolean") {
		return "boolean";
	}
	if (columnType === "PgTimestamp") {
		return "timestamp";
	}
	if (columnType === "PgDate") {
		return "date";
	}
	if (columnType === "PgTime") {
		return "time";
	}
	if (columnType === "PgDecimal") {
		return "decimal";
	}
	if (columnType === "PgReal") {
		return "real";
	}
	if (columnType === "PgDoublePrecision") {
		return "double precision";
	}
	if (columnType === "PgSmallInt") {
		return "smallint";
	}
	if (columnType === "PgSerial") {
		return "serial";
	}
	if (columnType === "PgBigSerial") {
		return "bigserial";
	}

	// Default to text if unknown
	return "text";
}

/**
 * Warns about automatic table name prefixing
 */
function warnAboutTablePrefixing(
	originalTableName: string,
	tableName: string,
	pluginId: string,
): void {
	rootLogger.warn(
		`Plugin table name automatically prefixed: "${originalTableName}" -> "${tableName}" (plugin: ${pluginId})`,
	);
	rootLogger.warn(
		"Consider using prefixed table names in your plugin code to avoid connectivity issues.",
	);
}

/**
 * Generates CREATE TABLE SQL from a Drizzle table definition
 */
export function generateCreateTableSQL(
	tableDefinition: Record<string, unknown>,
	pluginId?: string,
): string {
	const drizzleNameSymbol = Symbol.for("drizzle:Name");
	const drizzleColumnsSymbol = Symbol.for("drizzle:Columns");

	const originalTableName =
		(tableDefinition[
			drizzleNameSymbol as unknown as keyof typeof tableDefinition
		] as string) || "unknown_table";

	// If plugin ID is provided and table name doesn't already start with pluginId, prefix it
	const tableName =
		pluginId && !originalTableName.startsWith(`${pluginId}_`)
			? `${pluginId}_${originalTableName.replace(/^plugin_/, "")}`
			: originalTableName;

	// Warn if table name was automatically prefixed
	if (
		pluginId &&
		!originalTableName.startsWith(`${pluginId}_`) &&
		tableName !== originalTableName
	) {
		warnAboutTablePrefixing(originalTableName, tableName, pluginId);
	}

	const columns =
		(tableDefinition[
			drizzleColumnsSymbol as unknown as keyof typeof tableDefinition
		] as Record<string, unknown>) || {};

	const columnDefinitions: string[] = [];
	const constraints: string[] = [];

	for (const [columnName, column] of Object.entries(columns)) {
		const col = column as {
			name?: string;
			notNull?: boolean;
			primary?: boolean;
			default?: unknown;
			hasDefault?: boolean;
			defaultFn?: unknown;
			unique?: boolean;
		}; // Cast to specific type to avoid TypeScript issues with dynamic column types

		// Use the actual database column name from Drizzle, not the JavaScript property name
		const dbColumnName = col.name || columnName;
		let columnDef = `"${dbColumnName}" ${drizzleTypeToPostgresType(col)}`;

		// Handle NOT NULL constraint
		if (col.notNull) {
			columnDef += " NOT NULL";
		}

		// Handle PRIMARY KEY constraint
		if (col.primary) {
			columnDef += " PRIMARY KEY";
		}

		// Handle DEFAULT values
		if (col.default !== undefined) {
			if (typeof col.default === "string") {
				columnDef += ` DEFAULT '${col.default}'`;
			} else if (typeof col.default === "boolean") {
				columnDef += ` DEFAULT ${col.default}`;
			} else if (col.default === null) {
				columnDef += " DEFAULT NULL";
			}
		}

		// Handle Drizzle function defaults (.defaultNow(), $defaultFn, etc.)
		if (col.hasDefault || col.defaultFn) {
			const dbColumnName = col.name || columnName;
			// Handle UUID generation for id columns
			if (dbColumnName === "id" && drizzleTypeToPostgresType(col) === "uuid") {
				columnDef += " DEFAULT gen_random_uuid()";
			}
			// Handle timestamp columns with defaultNow()
			else if (drizzleTypeToPostgresType(col).includes("timestamp")) {
				columnDef += " DEFAULT now()";
			}
		}

		// Handle UNIQUE constraint
		if (col.unique) {
			columnDef += " UNIQUE";
		}

		columnDefinitions.push(columnDef);
	}

	let sql = `CREATE TABLE IF NOT EXISTS "${tableName}" (\n`;
	sql += columnDefinitions.map((def) => `  ${def}`).join(",\n");

	if (constraints.length > 0) {
		sql += `,\n${constraints
			.map((constraint) => `  ${constraint}`)
			.join(",\n")}`;
	}

	sql += "\n);";

	return sql;
}

/**
 * Generates CREATE INDEX SQL for table indexes
 */
export function generateCreateIndexSQL(
	tableDefinition: Record<string, unknown>,
	pluginId?: string,
): string[] {
	const drizzleNameSymbol = Symbol.for("drizzle:Name");
	const drizzleIndexesSymbol = Symbol.for("drizzle:Indexes");

	const originalTableName =
		(tableDefinition[
			drizzleNameSymbol as unknown as keyof typeof tableDefinition
		] as string) || "unknown_table";

	// If plugin ID is provided and table name doesn't already start with pluginId, prefix it
	const tableName =
		pluginId && !originalTableName.startsWith(`${pluginId}_`)
			? `${pluginId}_${originalTableName.replace(/^plugin_/, "")}`
			: originalTableName;

	// Warn if table name was automatically prefixed
	if (
		pluginId &&
		!originalTableName.startsWith(`${pluginId}_`) &&
		tableName !== originalTableName
	) {
		warnAboutTablePrefixing(originalTableName, tableName, pluginId);
	}

	const indexes =
		(tableDefinition[
			drizzleIndexesSymbol as unknown as keyof typeof tableDefinition
		] as Array<{
			columns: Array<{ name: string }>;
			unique?: boolean;
		}>) || [];

	const indexSQLs: string[] = [];

	for (let i = 0; i < indexes.length; i++) {
		const index = indexes[i];
		if (index) {
			const indexName = `${tableName}_${index.columns
				.map((col) => col.name)
				.join("_")}_index`;
			const columnNames = index.columns
				.map((col) => `"${col.name}"`)
				.join(", ");
			const uniqueKeyword = index.unique ? "UNIQUE " : "";

			const sql = `CREATE ${uniqueKeyword}INDEX IF NOT EXISTS "${indexName}" ON "${tableName}" (${columnNames});`;
			indexSQLs.push(sql);
		}
	}

	return indexSQLs;
}

/**
 * Dynamically creates database tables from plugin table definitions
 */
export async function createPluginTables(
	db: { execute: (sql: string) => Promise<unknown> },
	pluginId: string,
	tableDefinitions: Record<string, Record<string, unknown>>,
	logger?: ILogger,
): Promise<void> {
	// Import the plugin logger

	try {
		logger?.info?.(`Creating database tables for plugin: ${pluginId}`);

		for (const [tableName, tableDefinition] of Object.entries(
			tableDefinitions,
		)) {
			try {
				// Generate CREATE TABLE SQL with plugin ID prefix
				const createTableSQL = generateCreateTableSQL(
					tableDefinition,
					pluginId,
				);

				logger?.info?.(`Creating table: ${createTableSQL}`);

				// Execute CREATE TABLE
				await db.execute(createTableSQL);

				// Generate and execute CREATE INDEX statements
				const indexSQLs = generateCreateIndexSQL(tableDefinition, pluginId);

				for (const indexSQL of indexSQLs) {
					logger?.info?.(`Creating index: ${indexSQL}`);
					await db.execute(indexSQL);
				}

				logger?.info?.(
					`Successfully created table and indexes for: ${tableName}`,
				);
			} catch (error) {
				if (logger?.error) {
					logger.error({
						msg: `Table creation failed for ${tableName}`,
						err: error,
					});
				} else {
					rootLogger.error({
						msg: `Table creation failed for ${tableName}`,
						err: error,
					});
				}
				throw error;
			}
		}
	} catch (error) {
		if (logger?.error) {
			logger.error({
				msg: `Table creation process failed for plugin ${pluginId}`,
				err: error,
			});
		} else {
			rootLogger.error({
				msg: `Table creation process failed for plugin ${pluginId}`,
				err: error,
			});
		}
		throw error;
	}
}

/**
 * Dynamically drops database tables for a plugin
 */
export async function dropPluginTables(
	db: { execute: (sql: string) => Promise<unknown> },
	pluginId: string,
	tableDefinitions: Record<string, Record<string, unknown>>,
	logger?: ILogger,
): Promise<void> {
	try {
		logger?.info?.(`Dropping database tables for plugin: ${pluginId}`);

		for (const [tableName, tableDefinition] of Object.entries(
			tableDefinitions,
		)) {
			try {
				const drizzleNameSymbol = Symbol.for("drizzle:Name");
				const originalTableName =
					(tableDefinition[
						drizzleNameSymbol as unknown as keyof typeof tableDefinition
					] as string) || "unknown_table";

				// If plugin ID is provided and table name doesn't already start with pluginId, prefix it
				const prefixedTableName =
					pluginId && !originalTableName.startsWith(`${pluginId}_`)
						? `${pluginId}_${originalTableName.replace(/^plugin_/, "")}`
						: originalTableName;

				const dropSQL = `DROP TABLE IF EXISTS "${prefixedTableName}" CASCADE;`;
				logger?.info?.(`Dropping table: ${dropSQL}`);

				await db.execute(dropSQL);
				logger?.info?.(`Successfully dropped table: ${prefixedTableName}`);
			} catch (error) {
				logger?.error?.(
					`Error dropping table ${tableName}: ${
						error instanceof Error ? error.message : String(error)
					}`,
				);
				// Continue with other tables even if one fails
			}
		}

		logger?.info?.(`Completed dropping tables for plugin: ${pluginId}`);
	} catch (error) {
		logger?.error?.(
			`Error in dropPluginTables for plugin ${pluginId}: ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
		throw error;
	}
}

/**
 * Removes a plugin directory from the filesystem
 */
export async function removePluginDirectory(pluginId: string): Promise<void> {
	const pluginPath = path.join(
		process.cwd(),
		"src",
		"plugin",
		"available",
		pluginId,
	);

	try {
		// Clear module cache for the plugin to prevent memory leaks in dev mode
		clearPluginModuleCache(pluginPath);

		// Check if directory exists
		const exists = await directoryExists(pluginPath);
		if (!exists) {
			// Plugin directory doesn't exist, skipping removal
			return;
		}

		// Remove the directory and all its contents
		await fs.rm(pluginPath, { recursive: true, force: true });
	} catch (error) {
		rootLogger.error({
			msg: `Failed to remove plugin directory ${pluginId}`,
			err: error,
		});
		throw error;
	}
}

/**
 * Clear module cache entries for a plugin to prevent memory leaks
 * Note: In ES modules, we cannot directly access the module cache like in CommonJS
 * This function is kept for compatibility but does not perform cache clearing in ES modules
 */
export function clearPluginModuleCache(
	pluginPath: string,
	_cacheObj?: Record<string, unknown>,
): void {
	try {
		// In ES modules, we cannot access the module cache directly
		// The module cache is managed by the ES module loader and is not exposed
		// This function is kept for compatibility but does not perform cache clearing
		// The garbage collector will handle cleanup of unused modules automatically

		// Log that cache clearing is not available in ES modules
		rootLogger.info({
			msg: "Module cache clearing not available in ES modules",
			pluginPath,
		});

		// Non-critical operation, continue with cleanup
	} catch (error) {
		rootLogger.warn({ msg: "Failed to clear module cache", err: error });
		// Non-critical error, continue with cleanup
	}
}
