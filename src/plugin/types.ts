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
	resolver: string;
	description?: string;
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
	databaseTables: Record<string, unknown>;
	hooks: Record<string, (...args: unknown[]) => unknown>;
	status: PluginStatus;
	errorMessage?: string;
}

export interface IExtensionRegistry {
	graphql: {
		queries: Record<string, unknown>;
		mutations: Record<string, unknown>;
		subscriptions: Record<string, unknown>;
		types: Record<string, unknown>;
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
export interface IPluginContext {
	db: unknown; // Drizzle database instance
	graphql: unknown; // GraphQL schema builder
	pubsub: unknown; // PubSub instance
	logger: unknown; // Logger instance
	pluginManager?: unknown; // Reference to the plugin manager (optional to avoid circular dependency)
}

// Plugin Discovery Types
export interface IPluginDiscovery {
	scanDirectory(path: string): Promise<string[]>;
	validateManifest(manifest: IPluginManifest): boolean;
	loadManifest(pluginId: string): Promise<IPluginManifest>;
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

// Unified Plugin Interface for consistency
export interface IUnifiedPlugin {
	id: string;
	manifest: IPluginManifest;
	status: PluginStatus;
	errorMessage?: string;
	// Platform-specific implementations
	extensions?: {
		api?: {
			graphqlResolvers?: Record<string, unknown>;
			databaseTables?: Record<string, unknown>;
			hooks?: Record<string, (...args: unknown[]) => unknown>;
		};
		admin?: {
			components?: Record<string, unknown>;
			routes?: IRouteExtension[];
			drawer?: IDrawerExtension[];
		};
	};
}

// Plugin validation result interface
export interface IPluginValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
	missingFields: string[];
	invalidTypes: string[];
}

// Plugin performance metrics interface
export interface IPluginMetrics {
	pluginId: string;
	loadTime: number;
	activationTime: number;
	memoryUsage: number;
	errorCount: number;
	lastError?: Date;
	performanceScore: number;
}

// Admin-specific extension types (for unified interface)
export interface IRouteExtension {
	pluginId: string;
	path: string;
	component: string;
	exact?: boolean;
	isAdmin?: boolean;
	permissions?: string[];
}

export interface IDrawerExtension {
	pluginId: string;
	label: string;
	icon: string;
	path: string;
	isAdmin?: boolean;
	permissions?: string[];
	order?: number;
}
