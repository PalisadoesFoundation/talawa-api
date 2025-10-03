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
		await new Promise((resolve) => setTimeout(resolve, 10));
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
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		const result = await manager.executePreHooks("event", 1);
		expect(errorHook).toHaveBeenCalled();
		expect(goodHook).toHaveBeenCalled();
		expect(result).toBe(2);
		spy.mockRestore();
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
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		await expect(manager.executePostHooks("event", 1)).resolves.toBeUndefined();
		expect(errorHook).toHaveBeenCalled();
		expect(goodHook).toHaveBeenCalled();
		spy.mockRestore();
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
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
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
		spy.mockRestore();
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
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		const result = await (
			manager as unknown as { getInstalledPlugins: () => Promise<unknown[]> }
		).getInstalledPlugins();
		expect(Array.isArray(result)).toBe(true);
		spy.mockRestore();
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
});
