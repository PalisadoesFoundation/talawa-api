/**
 * Plugin Manager Components
 *
 * This module exports all the components that make up the plugin manager system.
 * This is the main entry point for the plugin manager - import from here instead of individual files.
 */

// Main PluginManager class
export { default as PluginManager, default } from "./core";

// Individual components (for advanced usage)
export { ExtensionLoader } from "./extensions";
export { PluginLifecycle } from "./lifecycle";
export { PluginRegistry } from "./registry";
