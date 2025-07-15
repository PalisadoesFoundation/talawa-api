import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IPluginContext, IPluginManifest } from "~/src/plugin/types";
import PluginManager from "../../src/plugin/manager";
import { loadPluginManifest, safeRequire } from "../../src/plugin/utils";

// Mock dependencies
const mockDb = {
	select: vi.fn(() => ({
		from: vi.fn(() => ({
			where: vi.fn(() => Promise.resolve([])),
		})),
	})),
	update: vi.fn(() => ({
		set: vi.fn(() => ({
			where: vi.fn(() => Promise.resolve()),
		})),
	})),
} as unknown as IPluginContext["db"];

const mockGraphQL = {} as IPluginContext["graphql"];
const mockPubSub = {} as IPluginContext["pubsub"];
const mockLogger = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
} as IPluginContext["logger"];

const mockContext: IPluginContext = {
	db: mockDb,
	graphql: mockGraphQL,
	pubsub: mockPubSub,
	logger: mockLogger,
};

// Mock plugin utilities
vi.mock("../../src/plugin/utils", () => ({
	directoryExists: vi.fn(),
	loadPluginManifest: vi.fn(),
	safeRequire: vi.fn(),
}));

// Import mocked utilities
import { directoryExists } from "~/src/plugin/utils";

describe("PluginManager", () => {
	let pluginManager: PluginManager;

	beforeEach(() => {
		vi.clearAllMocks();
		pluginManager = new PluginManager(mockContext);
	});

	describe("constructor", () => {
		it("should create a PluginManager instance", () => {
			expect(pluginManager).toBeDefined();
			expect(pluginManager).toBeInstanceOf(PluginManager);
		});
	});

	describe("loadPlugin", () => {
		it("should load a plugin successfully", async () => {
			const mockManifest: IPluginManifest = {
				name: "Test Plugin",
				pluginId: "test_plugin",
				version: "1.0.0",
				description: "Test plugin",
				author: "Test Author",
				main: "index.js",
			};

			vi.mocked(directoryExists).mockResolvedValue(true);
			vi.mocked(loadPluginManifest).mockResolvedValue(mockManifest);
			vi.mocked(safeRequire).mockResolvedValue({
				default: {
					onLoad: vi.fn(),
				},
			});

			const result = await pluginManager.loadPlugin("test_plugin");
			expect(result).toBe(true);
		});

		it("should fail to load non-existent plugin", async () => {
			vi.mocked(directoryExists).mockResolvedValue(false);

			const result = await pluginManager.loadPlugin("non_existent");
			expect(result).toBe(false);
		});

		it("should handle plugin with invalid manifest", async () => {
			vi.mocked(directoryExists).mockResolvedValue(true);
			vi.mocked(loadPluginManifest).mockResolvedValue(
				undefined as unknown as IPluginManifest,
			);

			const result = await pluginManager.loadPlugin("test_plugin");
			expect(result).toBe(false);
		});
	});

	describe("activatePlugin", () => {
		it("should activate a loaded plugin", async () => {
			const mockManifest: IPluginManifest = {
				name: "Test Plugin",
				pluginId: "test_plugin",
				version: "1.0.0",
				description: "Test plugin",
				author: "Test Author",
				main: "index.js",
			};

			// First load the plugin
			vi.mocked(directoryExists).mockResolvedValue(true);
			vi.mocked(loadPluginManifest).mockResolvedValue(mockManifest);
			vi.mocked(safeRequire).mockResolvedValue({
				default: {
					onLoad: vi.fn(),
					onActivate: vi.fn(),
				},
			});

			await pluginManager.loadPlugin("test_plugin");
			const result = await pluginManager.activatePlugin("test_plugin");
			expect(result).toBe(true);
		});

		it("should fail to activate non-loaded plugin", async () => {
			const result = await pluginManager.activatePlugin("non_loaded");
			expect(result).toBe(false);
		});
	});

	describe("deactivatePlugin", () => {
		it("should deactivate an active plugin", async () => {
			const mockManifest: IPluginManifest = {
				name: "Test Plugin",
				pluginId: "test_plugin",
				version: "1.0.0",
				description: "Test plugin",
				author: "Test Author",
				main: "index.js",
			};

			// Load and activate plugin first
			vi.mocked(directoryExists).mockResolvedValue(true);
			vi.mocked(loadPluginManifest).mockResolvedValue(mockManifest);
			vi.mocked(safeRequire).mockResolvedValue({
				default: {
					onLoad: vi.fn(),
					onActivate: vi.fn(),
					onDeactivate: vi.fn(),
				},
			});

			await pluginManager.loadPlugin("test_plugin");
			await pluginManager.activatePlugin("test_plugin");

			const result = await pluginManager.deactivatePlugin("test_plugin");
			expect(result).toBe(true);
		});

		it("should fail to deactivate non-active plugin", async () => {
			const result = await pluginManager.deactivatePlugin("non_active");
			expect(result).toBe(false);
		});
	});

	describe("unloadPlugin", () => {
		it("should unload a loaded plugin", async () => {
			const mockManifest: IPluginManifest = {
				name: "Test Plugin",
				pluginId: "test_plugin",
				version: "1.0.0",
				description: "Test plugin",
				author: "Test Author",
				main: "index.js",
			};

			// Load plugin first
			vi.mocked(directoryExists).mockResolvedValue(true);
			vi.mocked(loadPluginManifest).mockResolvedValue(mockManifest);
			vi.mocked(safeRequire).mockResolvedValue({
				default: {
					onLoad: vi.fn(),
					onUnload: vi.fn(),
				},
			});

			await pluginManager.loadPlugin("test_plugin");
			const result = await pluginManager.unloadPlugin("test_plugin");
			expect(result).toBe(true);
		});

		it("should fail to unload non-loaded plugin", async () => {
			const result = await pluginManager.unloadPlugin("non_loaded");
			expect(result).toBe(false);
		});
	});

	describe("getLoadedPlugins", () => {
		it("should return empty array when no plugins loaded", () => {
			const plugins = pluginManager.getLoadedPlugins();
			expect(plugins).toEqual([]);
		});

		it("should return loaded plugins", async () => {
			const mockManifest: IPluginManifest = {
				name: "Test Plugin",
				pluginId: "test_plugin",
				version: "1.0.0",
				description: "Test plugin",
				author: "Test Author",
				main: "index.js",
			};

			vi.mocked(directoryExists).mockResolvedValue(true);
			vi.mocked(loadPluginManifest).mockResolvedValue(mockManifest);
			vi.mocked(safeRequire).mockResolvedValue({
				default: {
					onLoad: vi.fn(),
				},
			});

			await pluginManager.loadPlugin("test_plugin");
			const plugins = pluginManager.getLoadedPlugins();
			expect(plugins).toHaveLength(1);
			expect(plugins[0]?.id).toBe("test_plugin");
		});
	});

	describe("isPluginLoaded", () => {
		it("should return false for non-loaded plugin", () => {
			const result = pluginManager.isPluginLoaded("non_loaded");
			expect(result).toBe(false);
		});

		it("should return true for loaded plugin", async () => {
			const mockManifest: IPluginManifest = {
				name: "Test Plugin",
				pluginId: "test_plugin",
				version: "1.0.0",
				description: "Test plugin",
				author: "Test Author",
				main: "index.js",
			};

			vi.mocked(directoryExists).mockResolvedValue(true);
			vi.mocked(loadPluginManifest).mockResolvedValue(mockManifest);
			vi.mocked(safeRequire).mockResolvedValue({
				default: {
					onLoad: vi.fn(),
				},
			});

			await pluginManager.loadPlugin("test_plugin");
			const result = pluginManager.isPluginLoaded("test_plugin");
			expect(result).toBe(true);
		});
	});

	describe("isPluginActive", () => {
		it("should return false for non-active plugin", () => {
			const result = pluginManager.isPluginActive("non_active");
			expect(result).toBe(false);
		});

		it("should return true for active plugin", async () => {
			const mockManifest: IPluginManifest = {
				name: "Test Plugin",
				pluginId: "test_plugin",
				version: "1.0.0",
				description: "Test plugin",
				author: "Test Author",
				main: "index.js",
			};

			vi.mocked(directoryExists).mockResolvedValue(true);
			vi.mocked(loadPluginManifest).mockResolvedValue(mockManifest);
			vi.mocked(safeRequire).mockResolvedValue({
				default: {
					onLoad: vi.fn(),
					onActivate: vi.fn(),
				},
			});

			await pluginManager.loadPlugin("test_plugin");
			await pluginManager.activatePlugin("test_plugin");

			const result = pluginManager.isPluginActive("test_plugin");
			expect(result).toBe(true);
		});
	});
});
