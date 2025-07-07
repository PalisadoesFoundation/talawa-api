/**
 * Utility functions for the Talawa API plugin system
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import type { IPluginManifest } from "./types";

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

	// Validate pluginId format (camelCase, snake_case, or lowercase)
	const pluginIdRegex = /^[a-z][a-zA-Z0-9_]*$/;
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
 * Scans a directory for available plugins
 */
export async function scanPluginsDirectory(
	pluginsDir: string,
): Promise<string[]> {
	try {
		const entries = await fs.readdir(pluginsDir, { withFileTypes: true });
		const pluginIds: string[] = [];

		for (const entry of entries) {
			if (entry.isDirectory()) {
				const pluginPath = path.join(pluginsDir, entry.name);
				const manifestPath = path.join(pluginPath, "manifest.json");

				try {
					await fs.access(manifestPath);
					pluginIds.push(entry.name);
				} catch {
					// Directory doesn't contain a manifest.json, skip it
				}
			}
		}

		return pluginIds;
	} catch (error) {
		console.error("Error scanning plugins directory:", error);
		return [];
	}
}

/**
 * Checks if a plugin ID is valid
 */
export function isValidPluginId(pluginId: string): boolean {
	if (!pluginId || typeof pluginId !== "string") {
		return false;
	}

	const pluginIdRegex = /^[a-z][a-zA-Z0-9_]*$/;
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
 * Safely requires a module with error handling
 */
export async function safeRequire<T = unknown>(
	modulePath: string,
): Promise<T | null> {
	try {
		const module = await import(modulePath);
		return module.default || module;
	} catch (error) {
		console.error(`Failed to require module ${modulePath}:`, error);
		return null;
	}
}

/**
 * Checks if a directory exists
 */
export async function directoryExists(dirPath: string): Promise<boolean> {
	try {
		const stats = await fs.stat(dirPath);
		return stats.isDirectory();
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
	logger?: { info?: (message: string) => void },
): Promise<void> {
	// Import the plugin logger
	const { pluginLogger } = await import("./logger");

	try {
		await pluginLogger.info("Starting table creation", {
			pluginId,
			tableCount: Object.keys(tableDefinitions).length,
			tableNames: Object.keys(tableDefinitions),
		});

		logger?.info?.(`Creating database tables for plugin: ${pluginId}`);

		for (const [tableName, tableDefinition] of Object.entries(
			tableDefinitions,
		)) {
			try {
				await pluginLogger.debug("Processing table definition", {
					pluginId,
					tableName,
					tableType: typeof tableDefinition,
					hasSymbols: Object.getOwnPropertySymbols(tableDefinition).map((s) =>
						s.toString(),
					),
				});

				// Generate CREATE TABLE SQL with plugin ID prefix
				const createTableSQL = generateCreateTableSQL(
					tableDefinition,
					pluginId,
				);
				await pluginLogger.info("Generated CREATE TABLE SQL", {
					pluginId,
					tableName,
					sql: createTableSQL,
				});

				logger?.info?.(`Creating table: ${createTableSQL}`);

				// Execute CREATE TABLE
				await db.execute(createTableSQL);
				await pluginLogger.info("CREATE TABLE executed successfully", {
					pluginId,
					tableName,
				});

				// Generate and execute CREATE INDEX statements
				const indexSQLs = generateCreateIndexSQL(tableDefinition, pluginId);
				await pluginLogger.debug("Generated index SQLs", {
					pluginId,
					tableName,
					indexCount: indexSQLs.length,
					indexSQLs,
				});

				for (const indexSQL of indexSQLs) {
					logger?.info?.(`Creating index: ${indexSQL}`);
					await db.execute(indexSQL);
					await pluginLogger.debug("Index created", {
						pluginId,
						tableName,
						indexSQL,
					});
				}

				logger?.info?.(
					`Successfully created table and indexes for: ${tableName}`,
				);
				await pluginLogger.info("Table creation completed", {
					pluginId,
					tableName,
				});
			} catch (error) {
				await pluginLogger.error("Table creation failed", {
					pluginId,
					tableName,
					error: error instanceof Error ? error.message : String(error),
				});
				throw error;
			}
		}

		await pluginLogger.info("All tables created successfully", {
			pluginId,
			tableCount: Object.keys(tableDefinitions).length,
		});
	} catch (error) {
		await pluginLogger.error("Table creation process failed", {
			pluginId,
			error: error instanceof Error ? error.message : String(error),
		});
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
	logger?: { info?: (message: string) => void },
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
				logger?.info?.(
					`Error dropping table ${tableName}: ${
						error instanceof Error ? error.message : String(error)
					}`,
				);
				// Continue with other tables even if one fails
			}
		}

		logger?.info?.(`Completed dropping tables for plugin: ${pluginId}`);
	} catch (error) {
		logger?.info?.(
			`Error in dropPluginTables for plugin ${pluginId}: ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
		throw error;
	}
}
