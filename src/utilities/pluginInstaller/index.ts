/**
 * Plugin installer utilities.
 *
 * This module provides utilities for installing and managing plugins:
 * - Validating plugin structure and manifests
 * - Extracting plugin zip files
 * - Installing and uninstalling plugins
 * - Managing plugin lifecycle
 */

// Extraction
export { extractPluginZip } from "./extraction";
// Installation
export { installPluginFromZip } from "./installation";
// Types
export type { PluginInstallationOptions, PluginZipStructure } from "./types";
// Validation
export { validatePluginZip } from "./validation";
