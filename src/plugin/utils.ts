/**
 * Utility functions for the Talawa API plugin system
 */

import { promises as fs } from "fs";
import path from "path";
import type { IPluginManifest } from "./types";

/**
 * Validates a plugin manifest structure
 */
export function validatePluginManifest(
	manifest: any,
): manifest is IPluginManifest {
	if (!manifest || typeof manifest !== "object") {
		return false;
	}

	const requiredFields = [
		"name",
		"pluginId",
		"version",
		"description",
		"author",
		"main",
	];

	for (const field of requiredFields) {
		if (!manifest[field] || typeof manifest[field] !== "string") {
			return false;
		}
	}

	// Validate version format (basic semver check)
	const versionRegex = /^\d+\.\d+\.\d+$/;
	if (!versionRegex.test(manifest.version)) {
		return false;
	}

	// Validate pluginId format (camelCase, snake_case, or lowercase)
	const pluginIdRegex = /^[a-z][a-zA-Z0-9_]*$/;
	if (!pluginIdRegex.test(manifest.pluginId)) {
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
export async function safeRequire<T = any>(
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
export function debounce<T extends (...args: any[]) => any>(
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
 * Creates a deep clone of an object
 */
export function deepClone<T>(obj: T): T {
	if (obj === null || typeof obj !== "object") {
		return obj;
	}

	if (obj instanceof Date) {
		return new Date(obj.getTime()) as T;
	}

	if (obj instanceof Array) {
		return obj.map((item) => deepClone(item)) as T;
	}

	if (typeof obj === "object") {
		const cloned = {} as T;
		for (const key in obj) {
			if (obj.hasOwnProperty(key)) {
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
function drizzleTypeToPostgresType(column: any): string {
	const columnType = (column as any).columnType;

	// Handle different Drizzle column types
	if (columnType === "PgUUID") {
		return "uuid";
	} else if (columnType === "PgText") {
		return "text";
	} else if (columnType === "PgVarchar") {
		const length = column.length || 255;
		return `varchar(${length})`;
	} else if (columnType === "PgBoolean") {
		return "boolean";
	} else if (columnType === "PgTimestamp") {
		const precision = column.precision ? `(${column.precision})` : "";
		const timezone = column.withTimezone ? " with time zone" : "";
		return `timestamp${precision}${timezone}`;
	} else if (columnType === "PgDate") {
		return "date";
	} else if (columnType === "PgInteger") {
		return "integer";
	} else if (columnType === "PgReal") {
		return "real";
	} else if (columnType === "PgNumeric") {
		return "numeric";
	} else if (columnType === "PgSerial") {
		return "serial";
	} else if (columnType === "PgBigSerial") {
		return "bigserial";
	}

	// Default to text if unknown
	return "text";
}

/**
 * Generates CREATE TABLE SQL from a Drizzle table definition
 */
export function generateCreateTableSQL(
	tableDefinition: any,
	pluginId?: string,
): string {
	const originalTableName =
		tableDefinition[Symbol.for("drizzle:Name")] || "unknown_table";

	// If plugin ID is provided and table name doesn't already start with pluginId, prefix it
	const tableName =
		pluginId && !originalTableName.startsWith(`${pluginId}_`)
			? `${pluginId}_${originalTableName.replace(/^plugin_/, "")}`
			: originalTableName;
	const columns = tableDefinition[Symbol.for("drizzle:Columns")] || {};

	const columnDefinitions: string[] = [];
	const constraints: string[] = [];

	for (const [columnName, column] of Object.entries(columns)) {
		const col = column as any; // Cast to any to avoid TypeScript issues with dynamic column types

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
		sql +=
			",\n" + constraints.map((constraint) => `  ${constraint}`).join(",\n");
	}

	sql += "\n);";

	return sql;
}

/**
 * Generates CREATE INDEX SQL for table indexes
 */
export function generateCreateIndexSQL(
	tableDefinition: any,
	pluginId?: string,
): string[] {
	const originalTableName =
		tableDefinition[Symbol.for("drizzle:Name")] || "unknown_table";

	// If plugin ID is provided and table name doesn't already start with pluginId, prefix it
	const tableName =
		pluginId && !originalTableName.startsWith(`${pluginId}_`)
			? `${pluginId}_${originalTableName.replace(/^plugin_/, "")}`
			: originalTableName;
	const indexes = tableDefinition[Symbol.for("drizzle:Indexes")] || [];

	const indexSQLs: string[] = [];

	for (let i = 0; i < indexes.length; i++) {
		const index = indexes[i];
		const indexName = `${tableName}_${index.columns
			.map((col: any) => col.name)
			.join("_")}_index`;
		const columnNames = index.columns
			.map((col: any) => `"${col.name}"`)
			.join(", ");
		const uniqueKeyword = index.unique ? "UNIQUE " : "";

		const sql = `CREATE ${uniqueKeyword}INDEX IF NOT EXISTS "${indexName}" ON "${tableName}" (${columnNames});`;
		indexSQLs.push(sql);
	}

	return indexSQLs;
}

/**
 * Dynamically creates database tables from plugin table definitions
 */
export async function createPluginTables(
	db: any,
	pluginId: string,
	tableDefinitions: Record<string, any>,
	logger?: any,
): Promise<void> {
	// Import the plugin logger
	const { pluginLogger } = await import("./logger");

	try {
		await pluginLogger.info("Starting table creation", {
			pluginId,
			tableCount: Object.keys(tableDefinitions).length,
			tableNames: Object.keys(tableDefinitions),
		});

		logger?.info(`Creating database tables for plugin: ${pluginId}`);

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

				logger?.info(`Creating table: ${createTableSQL}`);

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
					logger?.info(`Creating index: ${indexSQL}`);
					await db.execute(indexSQL);
					await pluginLogger.debug("Index created", {
						pluginId,
						tableName,
						indexSQL,
					});
				}

				logger?.info(
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
					error,
				});
				logger?.error(`Error creating table ${tableName}:`, error);
				throw error;
			}
		}

		logger?.info(`Successfully created all tables for plugin: ${pluginId}`);
		await pluginLogger.info("All tables created successfully", { pluginId });
	} catch (error) {
		await pluginLogger.error("Plugin table creation failed", {
			pluginId,
			error,
		});
		logger?.error(`Failed to create tables for plugin ${pluginId}:`, error);
		throw error;
	}
}

/**
 * Dynamically drops database tables for a plugin
 */
export async function dropPluginTables(
	db: any,
	pluginId: string,
	tableDefinitions: Record<string, any>,
	logger?: any,
): Promise<void> {
	try {
		logger?.info(`Dropping database tables for plugin: ${pluginId}`);

		for (const [tableName, tableDefinition] of Object.entries(
			tableDefinitions,
		)) {
			try {
				const actualTableName =
					tableDefinition[Symbol.for("drizzle:Name")] || tableName;
				const dropSQL = `DROP TABLE IF EXISTS "${actualTableName}" CASCADE;`;

				logger?.info(`Dropping table: ${dropSQL}`);
				await db.execute(dropSQL);

				logger?.info(`Successfully dropped table: ${actualTableName}`);
			} catch (error) {
				logger?.error(`Error dropping table ${tableName}:`, error);
				// Continue with other tables even if one fails
			}
		}

		logger?.info(`Finished dropping tables for plugin: ${pluginId}`);
	} catch (error) {
		logger?.error(`Failed to drop tables for plugin ${pluginId}:`, error);
		throw error;
	}
}
