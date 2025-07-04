/**
 * Plugin System Main Entry Point for Talawa API
 * 
 * This file exports all the main plugin system components and utilities
 * for use throughout the API application.
 */

export { default as PluginManager } from './manager';

export type {
  IPluginManifest,
  IExtensionPoints,
  IGraphQLExtension,
  IDatabaseExtension,
  IHookExtension,
  ILoadedPlugin,
  IExtensionRegistry,
  IPluginContext,
  IPluginDiscovery,
  IPluginLifecycle,
  IPluginError,
} from './types';

export {
  PluginStatus,
  ExtensionPointType,
} from './types';

export {
  validatePluginManifest,
  generatePluginId,
  loadPluginManifest,
  scanPluginsDirectory,
  isValidPluginId,
  normalizeImportPath,
  safeRequire,
  directoryExists,
  ensureDirectory,
  sortExtensionPoints,
  filterActiveExtensions,
  debounce,
  deepClone,
} from './utils';

// Plugin discovery and registry utilities
export {
  createPluginContext,
  initializePluginSystem,
} from './registry'; 