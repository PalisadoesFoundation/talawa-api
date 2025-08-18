/**
 * Centralized type definitions for the Talawa API plugin system
 */

// Plugin Manifest Types
export interface IPluginManifest {
	name: string;
	pluginId: string;
	version: string;
	description: string;
	author: string;
	main: string;
	extensionPoints?: IExtensionPoints;
	icon?: string;
	homepage?: string;
	license?: string;
	tags?: string[];
	dependencies?: Record<string, string>;
}

// Extension Point Types
export interface IExtensionPoints {
	graphql?: IGraphQLExtension[];
	database?: IDatabaseExtension[];
	hooks?: IHookExtension[];
}

export interface IGraphQLExtension {
	type: "query" | "mutation" | "subscription";
	name: string;
	file: string;
	description?: string;
	// Builder-first approach
	builderDefinition: string; // Function name that defines the GraphQL field using Pothos builder
}

export interface IDatabaseExtension {
	type: "table" | "enum" | "relation";
	name: string;
	file: string;
}

export interface IHookExtension {
	type: "pre" | "post";
	event: string;
	handler: string;
	file?: string;
}

// Plugin Manager Types
export interface ILoadedPlugin {
	id: string;
	manifest: IPluginManifest;
	graphqlResolvers: Record<string, unknown>;
	databaseTables: Record<string, Record<string, unknown>>;
	hooks: Record<string, (...args: unknown[]) => unknown>;
	status: PluginStatus;
	errorMessage?: string;
}

// Builder-first GraphQL extension interface
export interface IGraphQLBuilderExtension {
	pluginId: string;
	type: "query" | "mutation" | "subscription";
	fieldName: string;
	builderFunction: (builder: unknown) => void; // Function that registers with Pothos builder
	description?: string;
}

export interface IExtensionRegistry {
	graphql: {
		// Builder-first extensions only
		builderExtensions: IGraphQLBuilderExtension[];
	};
	database: {
		tables: Record<string, unknown>;
		enums: Record<string, unknown>;
		relations: Record<string, unknown>;
	};
	hooks: {
		pre: Record<string, ((...args: unknown[]) => unknown)[]>;
		post: Record<string, ((...args: unknown[]) => unknown)[]>;
	};
}

// Enums
export enum PluginStatus {
	ACTIVE = "active",
	INACTIVE = "inactive",
	ERROR = "error",
	LOADING = "loading",
}

export enum ExtensionPointType {
	GRAPHQL = "graphql",
	DATABASE = "database",
	HOOKS = "hooks",
}

// Plugin Context Types
export interface ILogger {
	info?: (message: string, ...args: unknown[]) => void;
	error?: (message: string, ...args: unknown[]) => void;
	warn?: (message: string, ...args: unknown[]) => void;
	debug?: (message: string, ...args: unknown[]) => void;
}

export interface IPluginContext {
	db: unknown; // Drizzle database instance
	graphql: unknown; // GraphQL schema builder
	pubsub: unknown; // PubSub instance
	logger: ILogger; // Logger instance
	pluginManager?: unknown; // Plugin manager instance (set after initialization)
}

// Plugin Lifecycle Types
export interface IPluginLifecycle {
	onLoad?(context: IPluginContext): Promise<void>;
	onActivate?(context: IPluginContext): Promise<void>;
	onDeactivate?(context: IPluginContext): Promise<void>;
	onUnload?(context: IPluginContext): Promise<void>;
}

// Plugin Error Types
export interface IPluginError {
	pluginId: string;
	error: Error;
	phase: "load" | "activate" | "deactivate" | "unload";
	timestamp: Date;
}

// Simplified database client interface used for type-casting where full Drizzle types are unavailable.
export interface IDatabaseClient {
	select: (...args: unknown[]) => {
		from: (table: unknown) => {
			where: (...args: unknown[]) => Promise<unknown[]>;
			limit?: (...args: unknown[]) => Promise<unknown[]>;
		};
	};
	update: (...args: unknown[]) => {
		set: (...args: unknown[]) => {
			where: (...args: unknown[]) => Promise<void>;
		};
	};
	execute?: (sql: string) => Promise<unknown>;
}
