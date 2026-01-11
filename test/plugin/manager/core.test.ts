import { beforeEach, describe, expect, it, vi } from "vitest";
import PluginManager from "../../../src/plugin/manager/core";
import type { ExtensionLoader } from "../../../src/plugin/manager/extensions";
import type { PluginLifecycle } from "../../../src/plugin/manager/lifecycle";
import type {
	IPluginContext,
	IPluginManifest,
} from "../../../src/plugin/types";
import { PluginStatus } from "../../../src/plugin/types";

// Mocks
vi.mock("../../../src/plugin/utils", () => ({
	directoryExists: vi.fn(),
	isValidPluginId: vi.fn(() => true),
	loadPluginManifest: vi.fn(),
	safeRequire: vi.fn(),
}));

// Mock schema manager to prevent schema rebuild errors
vi.mock("../../../src/graphql/schemaManager", () => ({
	GraphQLSchemaManager: class MockSchemaManager {
		rebuildSchema() {
			return Promise.resolve();
		}
		getCurrentSchema() {
			return null;
		}
	},
	schemaManager: {
		rebuildSchema() {
			return Promise.resolve();
		},
		getCurrentSchema() {
			return null;
		},
	},
}));

import {
	directoryExists,
	isValidPluginId,
	loadPluginManifest,
	safeRequire,
} from "../../../src/plugin/utils";

vi.mock("node:fs/promises", () => ({
	access: vi.fn(() => Promise.resolve()),
	mkdir: vi.fn(() => Promise.resolve()),
}));

// Mock DB plugin row type
const mockDbPlugin = {
	pluginId: "test-plugin",
	isActivated: true,
	isInstalled: true,
	id: "1",
	backup: false,
	createdAt: new Date(),
	updatedAt: null,
};

const baseManifest: IPluginManifest = {
	pluginId: "test-plugin",
	name: "Test Plugin",
	version: "1.0.0",
	description: "desc",
	author: "author",
	main: "index.js",
};

const pluginModule = { foo: () => 1 };

function createPluginContext(installedPlugins: unknown[] = [mockDbPlugin]) {
	return {
		db: {
			select: vi.fn(() => ({
				from: vi.fn(() => ({
					where: vi.fn(() => Promise.resolve(installedPlugins)),
				})),
			})),
			update: vi.fn(() => ({
				set: vi.fn(() => ({
					where: vi.fn(() => Promise.resolve()),
				})),
			})),
			insert: vi.fn(() => ({
				values: vi.fn(() => Promise.resolve()),
			})),
			delete: vi.fn(() => ({
				where: vi.fn(() => Promise.resolve()),
			})),
		},
		logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
		graphql: {},
		pubsub: {},
	} as unknown as IPluginContext;
}

// Subclass for testability
class TestablePluginManager extends PluginManager {
	public getTestExtensionLoader() {
		return (this as unknown as { extensionLoader: ExtensionLoader })
			.extensionLoader;
	}
	public getTestLifecycle() {
		return (this as unknown as { lifecycle: PluginLifecycle }).lifecycle;
	}
}

describe("PluginManager", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(directoryExists as ReturnType<typeof vi.fn>).mockResolvedValue(true);
		(isValidPluginId as ReturnType<typeof vi.fn>).mockReturnValue(true);
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockResolvedValue(
			baseManifest,
		);
		(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValue(pluginModule);
	});

	it("should initialize and load plugins from DB", async () => {
		const context = createPluginContext();
		const manager = new PluginManager(context, "/plugins");
		// Wait for async initialization
		await new Promise((resolve) => setTimeout(resolve, 50));
		expect(manager.isSystemInitialized()).toBe(true);
		expect(manager.getLoadedPluginIds()).toContain("test-plugin");
		expect(manager.getPlugin("test-plugin")).toBeDefined();
	});

	it("should handle no plugins in DB gracefully", async () => {
		const context = createPluginContext([]);
		const manager = new PluginManager(context, "/plugins");
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(manager.isSystemInitialized()).toBe(true);
		expect(manager.getLoadedPluginIds()).toHaveLength(0);
	});

	it("should not load plugin if manifest file is missing", async () => {
		(safeRequire as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
			throw new Error("File missing");
		});
		const context = createPluginContext();
		const manager = new PluginManager(context, "/plugins");
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(manager.getLoadedPluginIds()).not.toContain("test-plugin");
	});

	it("should not load plugin if manifest is invalid", async () => {
		(loadPluginManifest as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
			new Error("Invalid manifest"),
		);
		const context = createPluginContext();
		const manager = new PluginManager(context, "/plugins");
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(manager.getLoadedPluginIds()).not.toContain("test-plugin");
	});

	it("should not load plugin if module fails to load", async () => {
		(safeRequire as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
			new Error("Module error"),
		);
		const context = createPluginContext();
		const manager = new PluginManager(context, "/plugins");
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(manager.getLoadedPluginIds()).not.toContain("test-plugin");
	});

	it("should not load plugin if extension loading fails", async () => {
		const context = createPluginContext();
		const manager = new TestablePluginManager(context, "/plugins");
		// Patch the extensionLoader to throw
		vi.spyOn(
			manager.getTestExtensionLoader(),
			"loadExtensionPoints",
		).mockImplementation(() => {
			throw new Error("Extension error");
		});
		await expect(manager.loadPlugin("test-plugin")).resolves.toBe(false);
	});

	it("should activate and deactivate plugin", async () => {
		const context = createPluginContext();
		const manager = new TestablePluginManager(context, "/plugins");
		await new Promise((resolve) => setTimeout(resolve, 10));
		// Patch lifecycle methods
		vi.spyOn(manager.getTestLifecycle(), "activatePlugin").mockResolvedValue(
			true,
		);
		vi.spyOn(manager.getTestLifecycle(), "deactivatePlugin").mockResolvedValue(
			true,
		);
		await expect(manager.activatePlugin("test-plugin")).resolves.toBe(true);
		await expect(manager.deactivatePlugin("test-plugin")).resolves.toBe(true);
	});

	it("should unload plugin", async () => {
		const context = createPluginContext();
		const manager = new TestablePluginManager(context, "/plugins");
		await new Promise((resolve) => setTimeout(resolve, 10));
		vi.spyOn(manager.getTestLifecycle(), "unloadPlugin").mockResolvedValue(
			true,
		);
		await expect(manager.unloadPlugin("test-plugin")).resolves.toBe(true);
	});

	it("should handle plugin errors and update status", async () => {
		const context = createPluginContext();
		const manager = new TestablePluginManager(context, "/plugins");
		await new Promise((resolve) => setTimeout(resolve, 10));
		// Ensure plugin is loaded
		await manager.loadPlugin("test-plugin");
		(
			manager as unknown as {
				handlePluginError: (
					id: string,
					error: Error,
					operation: string,
				) => void;
			}
		).handlePluginError("test-plugin", new Error("fail"), "load");
		const plugin = manager.getPlugin("test-plugin");
		expect(plugin?.status).toBe(PluginStatus.ERROR);
		expect(manager.getErrors().length).toBeGreaterThan(0);
		manager.clearErrors();
		expect(manager.getErrors()).toHaveLength(0);
	});

	it("should return correct plugin status and info", async () => {
		const context = createPluginContext();
		const manager = new TestablePluginManager(context, "/plugins");
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(manager.isPluginLoaded("test-plugin")).toBe(true);
		expect(manager.getPlugin("test-plugin")).toBeDefined();
		expect(manager.getPluginsDirectory()).toBe("/plugins");
		expect(manager.getPluginContext()).toBe(context);
	});

	it("should execute pre and post hooks", async () => {
		const context = createPluginContext();
		const manager = new TestablePluginManager(context, "/plugins");
		await new Promise((resolve) => setTimeout(resolve, 10));
		// Add hooks
		manager.getExtensionRegistry().hooks.pre.event = [
			vi.fn((...args: unknown[]) => (args[0] as number) + 1),
		];
		manager.getExtensionRegistry().hooks.post.event = [
			vi.fn((..._args: unknown[]) => undefined),
		];
		const result = await manager.executePreHooks("event", 1);
		expect(result).toBe(2);
		await expect(manager.executePostHooks("event", 1)).resolves.toBeUndefined();
	});

	it("should return true for isPluginActive if plugin is active, false otherwise", async () => {
		const context = createPluginContext();
		const manager = new TestablePluginManager(context, "/plugins");
		await new Promise((resolve) => setTimeout(resolve, 10));
		const plugin = manager.getPlugin("test-plugin");
		if (plugin) plugin.status = PluginStatus.ACTIVE;
		expect(manager.isPluginActive("test-plugin")).toBe(true);
		if (plugin) plugin.status = PluginStatus.INACTIVE;
		expect(manager.isPluginActive("test-plugin")).toBe(false);
	});

	it("should handle errors in pre hooks and continue execution", async () => {
		const context = createPluginContext();
		const manager = new TestablePluginManager(context, "/plugins");
		await new Promise((resolve) => setTimeout(resolve, 10));
		const errorHook = vi.fn(() => {
			throw new Error("pre hook fail");
		});
		const goodHook = vi.fn((x) => (x as number) + 1);
		manager.getExtensionRegistry().hooks.pre.event = [errorHook, goodHook];
		const result = await manager.executePreHooks("event", 1);
		expect(errorHook).toHaveBeenCalled();
		expect(goodHook).toHaveBeenCalled();
		expect(result).toBe(2);
		// We expect logger to log the error
		expect(context.logger.error).toHaveBeenCalled();
	});

	it("should handle errors in post hooks and continue execution", async () => {
		const context = createPluginContext();
		const manager = new TestablePluginManager(context, "/plugins");
		await new Promise((resolve) => setTimeout(resolve, 10));
		const errorHook = vi.fn(async () => {
			throw new Error("post hook fail");
		});
		const goodHook = vi.fn(async () => undefined);
		manager.getExtensionRegistry().hooks.post.event = [errorHook, goodHook];
		await manager.executePostHooks("event", 1);
		expect(errorHook).toHaveBeenCalled();
		expect(goodHook).toHaveBeenCalled();
		// We expect logger to log the error
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(context.logger.error).toHaveBeenCalled();
	});

	it("should return a copy of errors from getErrors", async () => {
		const context = createPluginContext();
		const manager = new TestablePluginManager(context, "/plugins");
		await new Promise((resolve) => setTimeout(resolve, 10));
		(
			manager as unknown as {
				handlePluginError: (
					id: string,
					error: Error,
					operation: string,
				) => void;
			}
		).handlePluginError("test-plugin", new Error("fail"), "load");
		const errors = manager.getErrors();
		expect(Array.isArray(errors)).toBe(true);
		expect(errors.length).toBeGreaterThan(0);
		// Should be a copy, not the same reference
		errors.push({
			pluginId: "x",
			error: new Error("x"),
			phase: "load",
			timestamp: new Date(),
		});
		expect(manager.getErrors().length).toBe(1);
	});

	it("should return the plugin context from getPluginContext", async () => {
		const context = createPluginContext();
		const manager = new TestablePluginManager(context, "/plugins");
		expect(manager.getPluginContext()).toBe(context);
	});

	it("should handle initializePlugins error in constructor", async () => {
		const context = createPluginContext();
		const origInit = (
			PluginManager.prototype as unknown as {
				initializePlugins: () => Promise<void>;
			}
		).initializePlugins;
		(
			PluginManager.prototype as unknown as {
				initializePlugins: () => Promise<void>;
			}
		).initializePlugins = vi.fn().mockRejectedValue(new Error("init fail"));
		// Should not throw
		new PluginManager(context, "/plugins");
		(
			PluginManager.prototype as unknown as {
				initializePlugins: () => Promise<void>;
			}
		).initializePlugins = origInit;

		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(context.logger.error).toHaveBeenCalled();
	});

	it("should handle initialization failure in initializePlugins catch block (covers lines 152-157)", async () => {
		const context = createPluginContext([mockDbPlugin]);

		// Force initialization failure by making directoryExists throw
		// This simulates a random error during the async initialization process
		(directoryExists as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
			new Error("simulated initialization failure"),
		);

		const manager = new TestablePluginManager(context, "/plugins");

		// Wait for initialization to complete via event instead of timeout
		await new Promise<void>((resolve) => {
			manager.once("plugins:ready", () => resolve());
		});

		expect(context.logger.error).toHaveBeenCalledWith(
			expect.objectContaining({
				msg: "Plugin system initialization failed",
				err: expect.objectContaining({
					message: "simulated initialization failure",
				}),
			}),
		);
	});

	it("should call emit in markAsInitialized", () => {
		const context = createPluginContext();
		const manager = new TestablePluginManager(context, "/plugins");
		const emitSpy = vi.spyOn(manager, "emit");
		(
			manager as unknown as { markAsInitialized: () => void }
		).markAsInitialized();
		expect(emitSpy).toHaveBeenCalledWith("plugins:ready");
	});

	it("should handle error in getInstalledPlugins and return []", async () => {
		const context = createPluginContext();
		const manager = new TestablePluginManager(context, "/plugins");
		const origDb = context.db;
		context.db = null as unknown as typeof context.db;
		const result = await (
			manager as unknown as { getInstalledPlugins: () => Promise<unknown[]> }
		).getInstalledPlugins();
		expect(Array.isArray(result)).toBe(true);
		expect(context.logger.error).toHaveBeenCalled();
		context.db = origDb;
	});

	it("should handle error in loadPlugin outer catch", async () => {
		const context = createPluginContext();
		const manager = new TestablePluginManager(context, "/plugins");
		const spy = vi.spyOn(
			manager as TestablePluginManager,
			"handlePluginError" as keyof TestablePluginManager,
		) as unknown as { mockRestore: () => void };
		let callCount = 0;
		const origEmit = manager.emit;
		const emitSpy = vi.spyOn(manager, "emit").mockImplementation((...args) => {
			if (callCount === 0) {
				callCount++;
				throw new Error("fail");
			}
			return origEmit.apply(manager, args);
		});
		const result = await manager.loadPlugin("test-plugin");
		expect(result).toBe(false);
		emitSpy.mockRestore();
		spy.mockRestore();
	});

	it("should handle handlePluginError when plugin is not found", () => {
		const context = createPluginContext([]); // no plugins loaded
		const manager = new TestablePluginManager(context, "/plugins");
		const emitSpy = vi.spyOn(manager, "emit");
		(
			manager as unknown as {
				handlePluginError: (id: string, error: Error, phase: string) => void;
			}
		).handlePluginError("not-found", new Error("fail"), "load");
		expect(emitSpy).toHaveBeenCalledWith("plugin:error", expect.any(Object));
	});

	it("should return empty array from getActivePlugins if none are active", async () => {
		const context = createPluginContext();
		const manager = new TestablePluginManager(context, "/plugins");
		await new Promise((resolve) => setTimeout(resolve, 10));
		const plugin = manager.getPlugin("test-plugin");
		if (plugin) plugin.status = PluginStatus.INACTIVE;
		expect(manager.getActivePlugins()).toHaveLength(0);
	});

	it("should handle plugin not found in getPlugin", async () => {
		const context = createPluginContext();
		const manager = new TestablePluginManager(context, "/plugins");
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(manager.getPlugin("non-existent-plugin")).toBeUndefined();
	});

	it("should return false for isPluginLoaded when plugin not found", async () => {
		const context = createPluginContext();
		const manager = new TestablePluginManager(context, "/plugins");
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(manager.isPluginLoaded("non-existent-plugin")).toBe(false);
	});

	it("should return false for isPluginActive when plugin not found", async () => {
		const context = createPluginContext();
		const manager = new TestablePluginManager(context, "/plugins");
		await new Promise((resolve) => setTimeout(resolve, 10));
		expect(manager.isPluginActive("non-existent-plugin")).toBe(false);
	});

	it("should handle empty hooks in executePreHooks", async () => {
		const context = createPluginContext();
		const manager = new TestablePluginManager(context, "/plugins");
		await new Promise((resolve) => setTimeout(resolve, 10));
		manager.getExtensionRegistry().hooks.pre.event = [];
		const result = await manager.executePreHooks("event", 1);
		expect(result).toBe(1);
	});

	it("should handle empty hooks in executePostHooks", async () => {
		const context = createPluginContext();
		const manager = new TestablePluginManager(context, "/plugins");
		await new Promise((resolve) => setTimeout(resolve, 10));
		manager.getExtensionRegistry().hooks.post.event = [];
		await expect(manager.executePostHooks("event", 1)).resolves.toBeUndefined();
	});

	it("should handle lifecycle activation failure", async () => {
		const context = createPluginContext();
		const manager = new TestablePluginManager(context, "/plugins");
		await new Promise((resolve) => setTimeout(resolve, 10));
		vi.spyOn(manager.getTestLifecycle(), "activatePlugin").mockResolvedValue(
			false,
		);
		await expect(manager.activatePlugin("test-plugin")).resolves.toBe(false);
	});

	it("should handle lifecycle deactivation failure", async () => {
		const context = createPluginContext();
		const manager = new TestablePluginManager(context, "/plugins");
		await new Promise((resolve) => setTimeout(resolve, 10));
		vi.spyOn(manager.getTestLifecycle(), "deactivatePlugin").mockResolvedValue(
			false,
		);
		await expect(manager.deactivatePlugin("test-plugin")).resolves.toBe(false);
	});

	it("should handle lifecycle unload failure", async () => {
		const context = createPluginContext();
		const manager = new TestablePluginManager(context, "/plugins");
		await new Promise((resolve) => setTimeout(resolve, 10));
		vi.spyOn(manager.getTestLifecycle(), "unloadPlugin").mockResolvedValue(
			false,
		);
		await expect(manager.unloadPlugin("test-plugin")).resolves.toBe(false);
	});

	it("should handle plugin not found in lifecycle operations", async () => {
		const context = createPluginContext();
		const manager = new TestablePluginManager(context, "/plugins");
		await new Promise((resolve) => setTimeout(resolve, 10));
		await expect(manager.activatePlugin("non-existent-plugin")).rejects.toThrow(
			"Plugin non-existent-plugin is not loaded",
		);
		await expect(
			manager.deactivatePlugin("non-existent-plugin"),
		).rejects.toThrow("Plugin non-existent-plugin is not loaded");
		// unloadPlugin returns true for non-existent plugins (already unloaded)
		await expect(manager.unloadPlugin("non-existent-plugin")).resolves.toBe(
			true,
		);
	});

	it("should handle loadPlugin for non-existent plugin", async () => {
		const context = createPluginContext();
		const manager = new TestablePluginManager(context, "/plugins");
		await new Promise((resolve) => setTimeout(resolve, 10));
		// loadPlugin returns true for non-existent plugins (tries to load them)
		await expect(manager.loadPlugin("non-existent-plugin")).resolves.toBe(true);
	});

	it("should return correct plugin count in getLoadedPlugins", async () => {
		const context = createPluginContext();
		const manager = new TestablePluginManager(context, "/plugins");
		await new Promise((resolve) => setTimeout(resolve, 10));
		const plugins = manager.getLoadedPlugins();
		expect(plugins).toHaveLength(1);
		expect(plugins[0]?.manifest.pluginId).toBe("test-plugin");
	});

	it("should return correct plugin IDs in getLoadedPluginIds", async () => {
		const context = createPluginContext();
		const manager = new TestablePluginManager(context, "/plugins");
		await new Promise((resolve) => setTimeout(resolve, 10));
		const pluginIds = manager.getLoadedPluginIds();
		expect(pluginIds).toContain("test-plugin");
		expect(pluginIds).toHaveLength(1);
	});

	describe("Plugin Directory Creation", () => {
		it("should create plugins directory if it doesn't exist", async () => {
			const context = createPluginContext([]);
			(directoryExists as ReturnType<typeof vi.fn>).mockResolvedValue(false);
			const fs = await import("node:fs/promises");
			const mkdirSpy = vi.spyOn(fs, "mkdir").mockResolvedValue(undefined);

			new TestablePluginManager(context, "/plugins");
			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(mkdirSpy).toHaveBeenCalledWith("/plugins", { recursive: true });
		});

		it("should handle directory creation failure gracefully", async () => {
			const context = createPluginContext([]);
			(directoryExists as ReturnType<typeof vi.fn>).mockResolvedValue(false);
			const fs = await import("node:fs/promises");
			const mkdirSpy = vi
				.spyOn(fs, "mkdir")
				.mockRejectedValue(new Error("Permission denied"));

			const manager = new TestablePluginManager(context, "/plugins");
			await new Promise((resolve) => setTimeout(resolve, 10));

			expect(mkdirSpy).toHaveBeenCalledWith("/plugins", { recursive: true });
			expect(context.logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "Failed to create plugins directory",
					err: expect.any(Error),
				}),
			);
			expect(manager.isSystemInitialized()).toBe(true);
		});
	});

	describe("Plugin Activation During Load", () => {
		it("should activate plugin during load if it should be active", async () => {
			const context = createPluginContext([]); // No plugins in DB to avoid initialization
			const manager = new TestablePluginManager(context, "/plugins");
			await new Promise((resolve) => setTimeout(resolve, 10));

			const lifecycle = manager.getTestLifecycle();
			const activateSpy = vi
				.spyOn(lifecycle, "activatePlugin")
				.mockResolvedValue(true);

			// Mock file access to succeed
			const fs = await import("node:fs/promises");
			vi.spyOn(fs, "access").mockResolvedValue(undefined);

			// Mock the plugin to be active in database
			const mockDbPlugin = {
				pluginId: "test-plugin",
				isActivated: true,
				isInstalled: true,
				backup: false,
			};
			const registry = (
				manager as unknown as {
					registry: { getPluginFromDatabase: (id: string) => Promise<unknown> };
				}
			).registry;
			vi.spyOn(registry, "getPluginFromDatabase").mockResolvedValue(
				mockDbPlugin,
			);

			// Load a plugin that should be active
			const result = await manager.loadPlugin("test-plugin");
			expect(result).toBe(true);
			expect(activateSpy).toHaveBeenCalledWith("test-plugin", manager);
		});

		it("should handle activation failure during load gracefully", async () => {
			const context = createPluginContext([]); // No plugins in DB to avoid initialization
			const manager = new TestablePluginManager(context, "/plugins");
			await new Promise((resolve) => setTimeout(resolve, 10));

			const lifecycle = manager.getTestLifecycle();
			const activateSpy = vi
				.spyOn(lifecycle, "activatePlugin")
				.mockRejectedValue(new Error("Activation failed"));

			// Mock file access to succeed
			const fs = await import("node:fs/promises");
			vi.spyOn(fs, "access").mockResolvedValue(undefined);

			// Mock the plugin to be active in database
			const mockDbPlugin = {
				pluginId: "test-plugin",
				isActivated: true,
				isInstalled: true,
				backup: false,
			};
			const registry = (
				manager as unknown as {
					registry: { getPluginFromDatabase: (id: string) => Promise<unknown> };
				}
			).registry;
			vi.spyOn(registry, "getPluginFromDatabase").mockResolvedValue(
				mockDbPlugin,
			);

			// Load a plugin that should be active
			const result = await manager.loadPlugin("test-plugin");
			expect(result).toBe(true); // Plugin is still loaded even if activation fails
			expect(activateSpy).toHaveBeenCalledWith("test-plugin", manager);
			expect(context.logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "Failed to activate plugin test-plugin during load",
					err: expect.any(Error),
				}),
			);
		});
	});

	describe("Plugin Module Loading", () => {
		it("should handle plugin module loading failure", async () => {
			const context = createPluginContext([]); // No plugins in DB to avoid initialization
			const manager = new TestablePluginManager(context, "/plugins");
			await new Promise((resolve) => setTimeout(resolve, 10));

			(safeRequire as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
				new Error("Module load failed"),
			);
			const result = await manager.loadPlugin("test-plugin");
			expect(result).toBe(false);
			expect(context.logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "Failed to load module for plugin test-plugin",
					err: expect.any(Error),
				}),
			);
		});

		it("should handle null plugin module", async () => {
			const context = createPluginContext([]); // No plugins in DB to avoid initialization
			const manager = new TestablePluginManager(context, "/plugins");
			await new Promise((resolve) => setTimeout(resolve, 10));

			(safeRequire as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
			const result = await manager.loadPlugin("test-plugin");
			expect(result).toBe(false);
			expect(context.logger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "Failed to load module for plugin test-plugin",
					err: expect.any(Error),
				}),
			);
		});
	});

	describe("Plugin File Access", () => {
		it("should handle plugin file access failure", async () => {
			const context = createPluginContext([]); // No plugins in DB to avoid initialization
			const manager = new TestablePluginManager(context, "/plugins");
			await new Promise((resolve) => setTimeout(resolve, 10));

			const fs = await import("node:fs/promises");
			vi.spyOn(fs, "access").mockRejectedValue(new Error("File not found"));
			const result = await manager.loadPlugin("test-plugin");
			expect(result).toBe(false);
			expect(context.logger.warn).toHaveBeenCalledWith(
				expect.stringContaining(
					"Plugin test-plugin is in database but files are missing at /plugins/test-plugin",
				),
			);
		});
	});

	describe("Invalid Plugin ID", () => {
		it("should throw error for invalid plugin ID", async () => {
			const context = createPluginContext();
			const manager = new TestablePluginManager(context, "/plugins");
			await new Promise((resolve) => setTimeout(resolve, 10));

			(isValidPluginId as ReturnType<typeof vi.fn>).mockReturnValueOnce(false);

			await expect(manager.loadPlugin("invalid-plugin-id")).rejects.toThrow(
				"Invalid plugin ID: invalid-plugin-id",
			);
		});
	});

	describe("Plugin Already Loaded", () => {
		it("should return true if plugin is already loaded", async () => {
			const context = createPluginContext();
			const manager = new TestablePluginManager(context, "/plugins");
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Plugin is already loaded from initialization, but we need to ensure it's actually loaded
			// by mocking file access to succeed
			const fs = await import("node:fs/promises");
			vi.spyOn(fs, "access").mockResolvedValue(undefined);

			// First load the plugin
			await manager.loadPlugin("test-plugin");

			// Now try to load it again - it should return true since it's already loaded
			const result = await manager.loadPlugin("test-plugin");
			expect(result).toBe(true);
		});
	});

	describe("Graceful Shutdown", () => {
		it("should gracefully shutdown plugin system", async () => {
			const context = createPluginContext();
			const manager = new TestablePluginManager(context, "/plugins");
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Ensure plugin is loaded by mocking file access
			const fs = await import("node:fs/promises");
			vi.spyOn(fs, "access").mockResolvedValue(undefined);
			await manager.loadPlugin("test-plugin");

			const lifecycle = manager.getTestLifecycle();
			const getPluginModuleSpy = vi
				.spyOn(lifecycle, "getPluginModule")
				.mockResolvedValue({
					onUnload: vi.fn().mockResolvedValue(undefined),
				});
			const removeFromExtensionRegistrySpy = vi
				.spyOn(lifecycle, "removeFromExtensionRegistry")
				.mockImplementation(() => {});
			const emitSpy = vi.spyOn(manager, "emit");

			await manager.gracefulShutdown();

			expect(getPluginModuleSpy).toHaveBeenCalledWith("test-plugin");
			expect(removeFromExtensionRegistrySpy).toHaveBeenCalledWith(
				"test-plugin",
			);
			expect(emitSpy).toHaveBeenCalledWith("plugin:unloaded", "test-plugin");
			expect(manager.getLoadedPluginIds()).toHaveLength(0);
		});

		it("should handle errors during graceful shutdown", async () => {
			const context = createPluginContext();
			const manager = new TestablePluginManager(context, "/plugins");
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Ensure plugin is loaded by mocking file access
			const fs = await import("node:fs/promises");
			vi.spyOn(fs, "access").mockResolvedValue(undefined);
			await manager.loadPlugin("test-plugin");

			const lifecycle = manager.getTestLifecycle();
			const getPluginModuleSpy = vi
				.spyOn(lifecycle, "getPluginModule")
				.mockRejectedValue(new Error("Module error"));
			const loggerSpy = vi.spyOn(
				manager.getPluginContext().logger,
				"error",
			) as ReturnType<typeof vi.spyOn>;

			await manager.gracefulShutdown();

			expect(getPluginModuleSpy).toHaveBeenCalledWith("test-plugin");
			expect(loggerSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "Error during graceful shutdown of plugin test-plugin",
					err: expect.any(Error),
				}),
			);

			loggerSpy.mockRestore();
		});

		it("should handle plugin without onUnload hook during shutdown", async () => {
			const context = createPluginContext();
			const manager = new TestablePluginManager(context, "/plugins");
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Ensure plugin is loaded by mocking file access
			const fs = await import("node:fs/promises");
			vi.spyOn(fs, "access").mockResolvedValue(undefined);
			await manager.loadPlugin("test-plugin");

			const lifecycle = manager.getTestLifecycle();
			const getPluginModuleSpy = vi
				.spyOn(lifecycle, "getPluginModule")
				.mockResolvedValue({});
			const removeFromExtensionRegistrySpy = vi
				.spyOn(lifecycle, "removeFromExtensionRegistry")
				.mockImplementation(() => {});
			const emitSpy = vi.spyOn(manager, "emit");

			await manager.gracefulShutdown();

			expect(getPluginModuleSpy).toHaveBeenCalledWith("test-plugin");
			expect(removeFromExtensionRegistrySpy).toHaveBeenCalledWith(
				"test-plugin",
			);
			expect(emitSpy).toHaveBeenCalledWith("plugin:unloaded", "test-plugin");
		});

		it("should handle plugin not found during shutdown", async () => {
			const context = createPluginContext([]); // No plugins in DB
			const manager = new TestablePluginManager(context, "/plugins");
			await new Promise((resolve) => setTimeout(resolve, 10));

			const lifecycle = manager.getTestLifecycle();
			const getPluginModuleSpy = vi
				.spyOn(lifecycle, "getPluginModule")
				.mockResolvedValue({});

			await manager.gracefulShutdown();

			expect(getPluginModuleSpy).not.toHaveBeenCalled();
		});

		it("should handle onUnload hook error during shutdown", async () => {
			const context = createPluginContext();
			const manager = new TestablePluginManager(context, "/plugins");
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Ensure plugin is loaded by mocking file access
			const fs = await import("node:fs/promises");
			vi.spyOn(fs, "access").mockResolvedValue(undefined);
			await manager.loadPlugin("test-plugin");

			const lifecycle = manager.getTestLifecycle();
			const getPluginModuleSpy = vi
				.spyOn(lifecycle, "getPluginModule")
				.mockResolvedValue({
					onUnload: vi.fn().mockRejectedValue(new Error("Unload failed")),
				});
			const loggerSpy = vi.spyOn(
				manager.getPluginContext().logger,
				"error",
			) as ReturnType<typeof vi.spyOn>;

			await manager.gracefulShutdown();

			expect(getPluginModuleSpy).toHaveBeenCalledWith("test-plugin");
			expect(loggerSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "Error during graceful shutdown of plugin test-plugin",
					err: expect.any(Error),
				}),
			);

			loggerSpy.mockRestore();
		});

		it("should handle graceful shutdown error", async () => {
			const context = createPluginContext();
			const manager = new TestablePluginManager(context, "/plugins");
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Ensure plugin is loaded by mocking file access
			const fs = await import("node:fs/promises");
			vi.spyOn(fs, "access").mockResolvedValue(undefined);
			await manager.loadPlugin("test-plugin");

			// Mock lifecycle to throw error
			const lifecycle = manager.getTestLifecycle();
			vi.spyOn(lifecycle, "getPluginModule").mockImplementation(() => {
				throw new Error("Lifecycle error");
			});
			const loggerSpy = vi.spyOn(
				manager.getPluginContext().logger,
				"error",
			) as ReturnType<typeof vi.spyOn>;

			await manager.gracefulShutdown();

			expect(loggerSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "Error during graceful shutdown of plugin test-plugin",
					err: expect.any(Error),
				}),
			);

			loggerSpy.mockRestore();
		});

		it("should handle outer graceful shutdown error (covers lines 584-585)", async () => {
			const context = createPluginContext();
			const manager = new TestablePluginManager(context, "/plugins");
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Make removeAllListeners throw to trigger outer catch
			vi.spyOn(manager, "removeAllListeners").mockImplementation(() => {
				throw new Error("removeAllListeners failed");
			});
			const loggerSpy = vi.spyOn(
				manager.getPluginContext().logger,
				"error",
			) as ReturnType<typeof vi.spyOn>;

			await manager.gracefulShutdown();

			expect(loggerSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					msg: "Error during graceful plugin system shutdown",
					err: expect.any(Error),
				}),
			);

			loggerSpy.mockRestore();
		});
	});

	describe("Install Plugin", () => {
		it("should install plugin via lifecycle", async () => {
			const context = createPluginContext();
			const manager = new TestablePluginManager(context, "/plugins");
			await new Promise((resolve) => setTimeout(resolve, 10));

			const lifecycle = manager.getTestLifecycle();
			const installSpy = vi
				.spyOn(lifecycle, "installPlugin")
				.mockResolvedValue(true);

			const result = await manager.installPlugin("test-plugin");
			expect(result).toBe(true);
			expect(installSpy).toHaveBeenCalledWith("test-plugin", manager);
		});
	});

	describe("Uninstall Plugin", () => {
		it("should uninstall plugin via lifecycle", async () => {
			const context = createPluginContext();
			const manager = new TestablePluginManager(context, "/plugins");
			await new Promise((resolve) => setTimeout(resolve, 10));

			const lifecycle = manager.getTestLifecycle();
			const uninstallSpy = vi
				.spyOn(lifecycle, "uninstallPlugin")
				.mockResolvedValue(true);

			const result = await manager.uninstallPlugin("test-plugin");
			expect(result).toBe(true);
			expect(uninstallSpy).toHaveBeenCalledWith("test-plugin", manager);
		});
	});

	describe("Get Plugin From Database", () => {
		it("should get plugin from database via registry", async () => {
			const context = createPluginContext();
			const manager = new TestablePluginManager(context, "/plugins");
			await new Promise((resolve) => setTimeout(resolve, 10));

			const registry = (
				manager as unknown as {
					registry: { getPluginFromDatabase: (id: string) => Promise<unknown> };
				}
			).registry;
			const getPluginSpy = vi
				.spyOn(registry, "getPluginFromDatabase")
				.mockResolvedValue(mockDbPlugin);

			const result = await (
				manager as unknown as {
					getPluginFromDatabase: (id: string) => Promise<unknown>;
				}
			).getPluginFromDatabase("test-plugin");
			expect(result).toEqual(mockDbPlugin);
			expect(getPluginSpy).toHaveBeenCalledWith("test-plugin");
		});
	});

	describe("Plugin Status Updates", () => {
		it("should update plugin status to error when handling plugin error", async () => {
			const context = createPluginContext();
			const manager = new TestablePluginManager(context, "/plugins");
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Ensure plugin is loaded first by mocking file access
			const fs = await import("node:fs/promises");
			vi.spyOn(fs, "access").mockResolvedValue(undefined);
			await manager.loadPlugin("test-plugin");

			const plugin = manager.getPlugin("test-plugin");
			expect(plugin?.status).toBe(PluginStatus.ACTIVE);

			(
				manager as unknown as {
					handlePluginError: (id: string, error: Error, phase: string) => void;
				}
			).handlePluginError("test-plugin", new Error("Test error"), "load");

			const updatedPlugin = manager.getPlugin("test-plugin");
			expect(updatedPlugin?.status).toBe(PluginStatus.ERROR);
			expect(updatedPlugin?.errorMessage).toBe("Test error");
		});
	});

	describe("Extension Registry", () => {
		it("should return extension registry", async () => {
			const context = createPluginContext();
			const manager = new TestablePluginManager(context, "/plugins");
			await new Promise((resolve) => setTimeout(resolve, 10));

			const registry = manager.getExtensionRegistry();
			expect(registry).toBeDefined();
			expect(registry.graphql).toBeDefined();
			expect(registry.database).toBeDefined();
			expect(registry.hooks).toBeDefined();
		});
	});

	describe("Event Emission", () => {
		it("should emit events during plugin loading", async () => {
			const context = createPluginContext([]); // No plugins in DB to avoid initialization
			const manager = new TestablePluginManager(context, "/plugins");
			await new Promise((resolve) => setTimeout(resolve, 10));

			const emitSpy = vi.spyOn(manager, "emit");

			// Mock file access to succeed
			const fs = await import("node:fs/promises");
			vi.spyOn(fs, "access").mockResolvedValue(undefined);

			await manager.loadPlugin("test-plugin");

			expect(emitSpy).toHaveBeenCalledWith("plugin:loading", "test-plugin");
			expect(emitSpy).toHaveBeenCalledWith("plugin:loaded", "test-plugin");
		});

		it("should emit events during initialization", async () => {
			const context = createPluginContext();
			const manager = new TestablePluginManager(context, "/plugins");
			await new Promise((resolve) => setTimeout(resolve, 10));

			const emitSpy = vi.spyOn(manager, "emit");

			// Trigger initialization events
			(
				manager as unknown as { markAsInitialized: () => void }
			).markAsInitialized();

			expect(emitSpy).toHaveBeenCalledWith("plugins:ready");
		});
	});
});
