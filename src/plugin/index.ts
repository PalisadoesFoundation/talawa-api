/**
 * Plugin System Main Entry Point for Talawa API
 *
 * This file exports all the main plugin system components and utilities
 * for use throughout the API application.
 */

export { default as PluginManager } from "./manager";
// Plugin discovery and registry utilities
export {
	createPluginContext,
	initializePluginSystem,
} from "./registry";
export type {
	IDatabaseExtension,
	IExtensionPoints,
	IExtensionRegistry,
	IGraphQLExtension,
	IHookExtension,
	ILoadedPlugin,
	IPluginContext,
	IPluginError,
	IPluginLifecycle,
	IPluginManifest,
} from "./types";
export {
	ExtensionPointType,
	PluginStatus,
} from "./types";
export {
	debounce,
	deepClone,
	directoryExists,
	ensureDirectory,
	filterActiveExtensions,
	generatePluginId,
	isValidPluginId,
	loadPluginManifest,
	normalizeImportPath,
	safeRequire,
	sortExtensionPoints,
	validatePluginManifest,
} from "./utils";
