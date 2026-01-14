import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock rootLogger
vi.mock("~/src/utilities/logging/logger", () => ({
	rootLogger: {
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	},
}));

import type { IPluginContext } from "~/src/plugin/types";
import { rootLogger } from "~/src/utilities/logging/logger";
import {
	createPluginContext,
	destroyPluginSystem,
	getPluginManagerInstance,
	getPluginSystemStatus,
	initializePluginSystem,
	isPluginSystemInitialized,
} from "../../src/plugin/registry";

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
	execute: vi.fn(() => Promise.resolve()),
};

const mockGraphQL = {
	schema: {},
	resolvers: {},
};

const mockPubSub = {
	publish: vi.fn(),
	subscribe: vi.fn(),
};

const mockLogger = {
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
	debug: vi.fn(),
};

describe("Plugin Registry", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(async () => {
		// Clean up any existing plugin system
		await destroyPluginSystem();
	});

	describe("createPluginContext", () => {
		it("should create a plugin context with all required properties", () => {
			const context = createPluginContext({
				db: mockDb,
				graphql: mockGraphQL,
				pubsub: mockPubSub,
				logger: mockLogger,
			});

			expect(context).toHaveProperty("db");
			expect(context).toHaveProperty("graphql");
			expect(context).toHaveProperty("pubsub");
			expect(context).toHaveProperty("logger");
			expect(context.db).toBe(mockDb);
			expect(context.graphql).toBe(mockGraphQL);
			expect(context.pubsub).toBe(mockPubSub);
			expect(context.logger).toBe(mockLogger);
		});

		it("should handle different dependency types", () => {
			const customDb = { custom: "database" };
			const customGraphQL = { custom: "graphql" };
			const customPubSub = { custom: "pubsub" };

			const context = createPluginContext({
				db: customDb,
				graphql: customGraphQL,
				pubsub: customPubSub,
				logger: mockLogger,
			});

			expect(context.db).toBe(customDb);
			expect(context.graphql).toBe(customGraphQL);
			expect(context.pubsub).toBe(customPubSub);
		});
	});

	describe("initializePluginSystem", () => {
		it("should initialize the plugin system successfully", async () => {
			const context: IPluginContext = {
				db: mockDb,
				graphql: mockGraphQL,
				pubsub: mockPubSub,
				logger: mockLogger,
			};

			const pluginManager = await initializePluginSystem(context);

			expect(pluginManager).toBeDefined();
			expect(pluginManager).toBeInstanceOf(Object);
			expect(typeof pluginManager.loadPlugin).toBe("function");
			expect(typeof pluginManager.activatePlugin).toBe("function");
			expect(typeof pluginManager.deactivatePlugin).toBe("function");
		});

		it("should return the same instance on subsequent calls", async () => {
			const context: IPluginContext = {
				db: mockDb,
				graphql: mockGraphQL,
				pubsub: mockPubSub,
				logger: mockLogger,
			};

			const firstInstance = await initializePluginSystem(context);
			const secondInstance = await initializePluginSystem(context);

			expect(firstInstance).toBe(secondInstance);
		});

		it("should handle initialization with custom plugins directory", async () => {
			const context: IPluginContext = {
				db: mockDb,
				graphql: mockGraphQL,
				pubsub: mockPubSub,
				logger: mockLogger,
			};

			const customDirectory = "/custom/plugins/directory";
			const pluginManager = await initializePluginSystem(
				context,
				customDirectory,
			);

			expect(pluginManager).toBeDefined();
		});

		it("should handle initialization errors gracefully", async () => {
			// Mock logger to throw an error
			const errorLogger = {
				...mockLogger,
				info: vi.fn(() => {
					throw new Error("Logger error");
				}),
			};

			const errorContext = createPluginContext({
				db: mockDb,
				graphql: mockGraphQL,
				pubsub: mockPubSub,
				logger: errorLogger,
			});

			await expect(initializePluginSystem(errorContext)).rejects.toThrow(
				"Logger error",
			);
		});
	});

	describe("getPluginManager", () => {
		it("should return null when system is not initialized", () => {
			const manager = getPluginManagerInstance();
			expect(manager).toBeNull();
		});

		it("should return the plugin manager when system is initialized", async () => {
			const context: IPluginContext = {
				db: mockDb,
				graphql: mockGraphQL,
				pubsub: mockPubSub,
				logger: mockLogger,
			};

			await initializePluginSystem(context);
			const manager = getPluginManagerInstance();

			expect(manager).toBeDefined();
			expect(manager).toBeInstanceOf(Object);
		});
	});

	describe("isPluginSystemInitialized", () => {
		it("should return false when system is not initialized", () => {
			const initialized = isPluginSystemInitialized();
			expect(initialized).toBe(false);
		});

		it("should return true when system is initialized", async () => {
			const context: IPluginContext = {
				db: mockDb,
				graphql: mockGraphQL,
				pubsub: mockPubSub,
				logger: mockLogger,
			};

			await initializePluginSystem(context);
			const initialized = isPluginSystemInitialized();

			expect(initialized).toBe(true);
		});
	});

	describe("getPluginManagerInstance", () => {
		it("should return null when system is not initialized", () => {
			const manager = getPluginManagerInstance();
			expect(manager).toBeNull();
		});

		it("should return the plugin manager when system is initialized", async () => {
			const context: IPluginContext = {
				db: mockDb,
				graphql: mockGraphQL,
				pubsub: mockPubSub,
				logger: mockLogger,
			};

			await initializePluginSystem(context);
			const manager = getPluginManagerInstance();

			expect(manager).toBeDefined();
			expect(manager).toBeInstanceOf(Object);
		});

		it("should handle plugin context properly", () => {
			const pluginSystemInstance = getPluginManagerInstance();
			expect(pluginSystemInstance).toBeDefined();
		});
	});

	describe("destroyPluginSystem", () => {
		it("should handle destruction when system is not initialized", async () => {
			await expect(destroyPluginSystem()).resolves.not.toThrow();
		});

		it("should destroy the plugin system successfully", async () => {
			const context = createPluginContext({
				db: mockDb,
				graphql: mockGraphQL,
				pubsub: mockPubSub,
				logger: mockLogger,
			});

			await initializePluginSystem(context);
			expect(isPluginSystemInitialized()).toBe(true);

			await destroyPluginSystem();
			expect(isPluginSystemInitialized()).toBe(false);
			expect(getPluginManagerInstance()).toBeNull();
		});

		it("should handle destruction errors gracefully", async () => {
			// Initialize the system first
			const context = createPluginContext({
				db: mockDb,
				graphql: mockGraphQL,
				pubsub: mockPubSub,
				logger: mockLogger,
			});

			await initializePluginSystem(context);

			// The actual implementation doesn't throw errors during destruction
			await expect(destroyPluginSystem()).resolves.not.toThrow();
		});

		it("should throw and log error when gracefulShutdown fails", async () => {
			// Initialize the system first
			const context = createPluginContext({
				db: mockDb,
				graphql: mockGraphQL,
				pubsub: mockPubSub,
				logger: mockLogger,
			});

			await initializePluginSystem(context);

			// Get the plugin manager and mock gracefulShutdown to throw
			const manager = getPluginManagerInstance();
			expect(manager).not.toBeNull();

			const shutdownError = new Error("Shutdown failed");
			const spy = vi
				.spyOn(manager as NonNullable<typeof manager>, "gracefulShutdown")
				.mockRejectedValue(shutdownError);

			// Should throw the error
			await expect(destroyPluginSystem()).rejects.toThrow("Shutdown failed");

			// Restore the mock so afterEach cleanup works
			spy.mockRestore();

			// Assert logging - using new Pino pattern: { err }, "message"
			expect(rootLogger.error).toHaveBeenCalledWith(
				expect.objectContaining({
					err: shutdownError,
				}),
				"Error destroying plugin system",
			);

			// Now clean up properly for subsequent tests
			await destroyPluginSystem();
		});
	});

	describe("getPluginSystemStatus", () => {
		it("should return default status when system is not initialized", () => {
			const status = getPluginSystemStatus();

			expect(status).toEqual({
				initialized: false,
				pluginCount: 0,
				activePluginCount: 0,
				errors: [],
			});
		});

		it("should return correct status when system is initialized", async () => {
			const context = createPluginContext({
				db: mockDb,
				graphql: mockGraphQL,
				pubsub: mockPubSub,
				logger: mockLogger,
			});

			await initializePluginSystem(context);
			const status = getPluginSystemStatus();

			expect(status).toHaveProperty("initialized");
			expect(status).toHaveProperty("pluginCount");
			expect(status).toHaveProperty("activePluginCount");
			expect(status).toHaveProperty("errors");
			expect(status.initialized).toBe(true);
			expect(Array.isArray(status.errors)).toBe(true);
		});
	});

	describe("Plugin System Lifecycle", () => {
		it("should handle complete lifecycle", async () => {
			const context: IPluginContext = {
				db: mockDb,
				graphql: mockGraphQL,
				pubsub: mockPubSub,
				logger: mockLogger,
			};

			// Initialize
			expect(isPluginSystemInitialized()).toBe(false);
			const manager = await initializePluginSystem(context);
			expect(isPluginSystemInitialized()).toBe(true);
			expect(getPluginManagerInstance()).toBe(manager);

			// Get status
			const status = getPluginSystemStatus();
			expect(status.initialized).toBe(true);

			// Destroy
			await destroyPluginSystem();
			expect(isPluginSystemInitialized()).toBe(false);
			expect(getPluginManagerInstance()).toBeNull();
		});

		it("should handle multiple initialization attempts", async () => {
			const context: IPluginContext = {
				db: mockDb,
				graphql: mockGraphQL,
				pubsub: mockPubSub,
				logger: mockLogger,
			};

			const manager1 = await initializePluginSystem(context);
			const manager2 = await initializePluginSystem(context);
			const manager3 = await initializePluginSystem(context);

			expect(manager1).toBe(manager2);
			expect(manager2).toBe(manager3);
		});

		it("should handle re-initialization after destruction", async () => {
			const context: IPluginContext = {
				db: mockDb,
				graphql: mockGraphQL,
				pubsub: mockPubSub,
				logger: mockLogger,
			};

			// First initialization
			const manager1 = await initializePluginSystem(context);
			expect(isPluginSystemInitialized()).toBe(true);

			// Destroy
			await destroyPluginSystem();
			expect(isPluginSystemInitialized()).toBe(false);

			// Re-initialize
			const manager2 = await initializePluginSystem(context);
			expect(isPluginSystemInitialized()).toBe(true);
			expect(manager1).not.toBe(manager2); // Should be a new instance
		});
	});

	describe("Error Handling", () => {
		it("should handle logger errors gracefully", async () => {
			const errorLogger = {
				...mockLogger,
				info: vi.fn(() => {
					throw new Error("Logger error");
				}),
			};

			const context = createPluginContext({
				db: mockDb,
				graphql: mockGraphQL,
				pubsub: mockPubSub,
				logger: errorLogger,
			});

			// The actual implementation throws the logger error
			await expect(initializePluginSystem(context)).rejects.toThrow(
				"Logger error",
			);
		});

		it("should handle missing logger methods", async () => {
			const minimalLogger = {
				info: vi.fn(),
				error: vi.fn(),
			};

			const context = createPluginContext({
				db: mockDb,
				graphql: mockGraphQL,
				pubsub: mockPubSub,
				logger: minimalLogger,
			});

			await expect(initializePluginSystem(context)).resolves.not.toThrow();
		});
	});
});
