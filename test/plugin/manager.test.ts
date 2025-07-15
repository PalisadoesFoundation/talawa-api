import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { pluginsTable } from "~/src/drizzle/tables/plugins";
import type { IPluginContext, IPluginManifest } from "~/src/plugin/types";
import PluginManager from "../../src/plugin/manager";
import { server } from "../server";

const TEST_PLUGINS_DIR = path.join(process.cwd(), "test-temp-plugins");

const makeContext = (): IPluginContext => ({
	db: server.drizzleClient,
	graphql: {},
	pubsub: {},
	logger: console,
});

describe("PluginManager Integration", () => {
	let pluginManager: PluginManager;

	beforeEach(async () => {
		// Clean up plugins table and temp dir before each test
		await server.drizzleClient.delete(pluginsTable);
		await fs
			.rm(TEST_PLUGINS_DIR, { recursive: true, force: true })
			.catch(() => {});
		await fs.mkdir(TEST_PLUGINS_DIR, { recursive: true });
		pluginManager = new PluginManager(makeContext(), TEST_PLUGINS_DIR);
		// Wait for async init
		await new Promise((r) => setTimeout(r, 100));
	});

	afterEach(async () => {
		await server.drizzleClient.delete(pluginsTable);
		await fs
			.rm(TEST_PLUGINS_DIR, { recursive: true, force: true })
			.catch(() => {});
	});

	it("should load a plugin from real files and DB", async () => {
		const pluginId = "test_plugin";
		const pluginPath = path.join(TEST_PLUGINS_DIR, pluginId);
		await fs.mkdir(pluginPath, { recursive: true });
		const manifest: IPluginManifest = {
			name: "Test Plugin",
			pluginId,
			version: "1.0.0",
			description: "desc",
			author: "me",
			main: "index.js",
		};
		await fs.writeFile(
			path.join(pluginPath, "manifest.json"),
			JSON.stringify(manifest),
		);
		await fs.writeFile(
			path.join(pluginPath, "index.js"),
			"module.exports = { onLoad: () => {}, onActivate: () => {}, onDeactivate: () => {}, onUnload: () => {} };",
		);
		// Insert into DB
		await server.drizzleClient.insert(pluginsTable).values({
			pluginId,
			isInstalled: true,
			isActivated: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		// Reload manager to trigger DB load
		pluginManager = new PluginManager(makeContext(), TEST_PLUGINS_DIR);
		await new Promise((r) => setTimeout(r, 100));
		expect(pluginManager.isPluginLoaded(pluginId)).toBe(true);
	});

	it("should activate and deactivate a plugin", async () => {
		const pluginId = "test_plugin";
		const pluginPath = path.join(TEST_PLUGINS_DIR, pluginId);
		await fs.mkdir(pluginPath, { recursive: true });
		const manifest: IPluginManifest = {
			name: "Test Plugin",
			pluginId,
			version: "1.0.0",
			description: "desc",
			author: "me",
			main: "index.js",
		};
		await fs.writeFile(
			path.join(pluginPath, "manifest.json"),
			JSON.stringify(manifest),
		);
		await fs.writeFile(
			path.join(pluginPath, "index.js"),
			"module.exports = { onLoad: () => {}, onActivate: () => {}, onDeactivate: () => {} };",
		);
		await server.drizzleClient.insert(pluginsTable).values({
			pluginId,
			isInstalled: true,
			isActivated: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		pluginManager = new PluginManager(makeContext(), TEST_PLUGINS_DIR);
		await new Promise((r) => setTimeout(r, 100));
		await pluginManager.activatePlugin(pluginId);
		expect(pluginManager.isPluginActive(pluginId)).toBe(true);
		await pluginManager.deactivatePlugin(pluginId);
		expect(pluginManager.isPluginActive(pluginId)).toBe(false);
	});

	it("should handle plugin not found", async () => {
		const pluginId = "nonexistent_plugin";
		expect(pluginManager.isPluginLoaded(pluginId)).toBe(false);
		expect(pluginManager.isPluginActive(pluginId)).toBe(false);
		await expect(pluginManager.activatePlugin(pluginId)).rejects.toThrow();
		await expect(pluginManager.deactivatePlugin(pluginId)).rejects.toThrow();
	});

	it("should handle plugin with missing files", async () => {
		const pluginId = "missing_files_plugin";
		// Insert into DB but don't create files
		await server.drizzleClient.insert(pluginsTable).values({
			pluginId,
			isInstalled: true,
			isActivated: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		// Reload manager to trigger DB load
		pluginManager = new PluginManager(makeContext(), TEST_PLUGINS_DIR);
		await new Promise((r) => setTimeout(r, 100));
		expect(pluginManager.isPluginLoaded(pluginId)).toBe(false);
		expect(pluginManager.isPluginActive(pluginId)).toBe(false);
	});
});
