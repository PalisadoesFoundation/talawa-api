import type { FastifyInstance } from "fastify";
import {
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";

// Type for mock Fastify instance
type MockFastifyInstance = Partial<FastifyInstance> & {
	log: {
		info: ReturnType<typeof vi.fn>;
		error: ReturnType<typeof vi.fn>;
		warn: ReturnType<typeof vi.fn>;
		debug: ReturnType<typeof vi.fn>;
		child: ReturnType<typeof vi.fn>;
		level: string;
		fatal: ReturnType<typeof vi.fn>;
		trace: ReturnType<typeof vi.fn>;
		silent: ReturnType<typeof vi.fn>;
	};
	drizzleClient: unknown;
	addHook: ReturnType<typeof vi.fn>;
};

// Create hoisted mock for fastify-plugin to track calls
const fastifyPluginMock = vi.hoisted(() => {
	return vi.fn((fn: unknown, _options?: unknown) => fn);
});

// Mock the background worker service
vi.mock("~/src/workers", () => ({
	startBackgroundWorkers: vi.fn(),
	stopBackgroundWorkers: vi.fn(),
}));

// Mock fastify-plugin
vi.mock("fastify-plugin", () => ({
	default: fastifyPluginMock,
}));

import { startBackgroundWorkers, stopBackgroundWorkers } from "~/src/workers";

// Import the plugin - will be loaded in beforeAll
let backgroundWorkersPlugin: (fastify: FastifyInstance) => Promise<void>;

describe("Background Workers Plugin", () => {
	let mockFastify: MockFastifyInstance;

	beforeAll(async () => {
		// Import the plugin once - this triggers fastifyPlugin call
		// The default export is wrapped with fastifyPlugin, but our mock returns the function as-is
		const pluginModule = await import("../../src/plugins/backgroundWorkers");
		backgroundWorkersPlugin = pluginModule.default as (
			fastify: FastifyInstance,
		) => Promise<void>;
	});

	beforeEach(async () => {
		// Clear mocks but preserve fastifyPluginMock call history
		vi.mocked(startBackgroundWorkers).mockClear();
		vi.mocked(stopBackgroundWorkers).mockClear();

		// Create mock fastify instance
		mockFastify = {
			log: {
				info: vi.fn(),
				error: vi.fn(),
				warn: vi.fn(),
				debug: vi.fn(),
				child: vi.fn(),
				level: "info",
				fatal: vi.fn(),
				trace: vi.fn(),
				silent: vi.fn(),
			},
			drizzleClient: {},
			addHook: vi.fn(),
		} as MockFastifyInstance;

		// Setup mocks
		vi.mocked(startBackgroundWorkers).mockResolvedValue(undefined);
		vi.mocked(stopBackgroundWorkers).mockResolvedValue(undefined);
	});

	afterEach(() => {
		// Clear mocks but don't restore - vi.mock() mocks are automatically managed
		// We don't restore fastifyPluginMock to preserve its call history
		vi.mocked(startBackgroundWorkers).mockClear();
		vi.mocked(stopBackgroundWorkers).mockClear();
	});

	describe("Plugin Initialization", () => {
		it("should log initialization message", async () => {
			await backgroundWorkersPlugin(mockFastify as FastifyInstance);

			expect(mockFastify.log?.info).toHaveBeenCalledWith(
				"Initializing background workers...",
			);
		});

		it("should start background workers with correct parameters", async () => {
			await backgroundWorkersPlugin(mockFastify as FastifyInstance);

			expect(startBackgroundWorkers).toHaveBeenCalledWith(
				mockFastify.drizzleClient,
				mockFastify.log,
				mockFastify,
			);
		});

		it("should log success message after starting workers", async () => {
			await backgroundWorkersPlugin(mockFastify as FastifyInstance);

			expect(mockFastify.log?.info).toHaveBeenCalledWith(
				"Background workers started successfully",
			);
		});

		it("should handle errors during worker startup", async () => {
			const startupError = new Error("Failed to start workers");
			vi.mocked(startBackgroundWorkers).mockRejectedValue(startupError);

			await expect(
				backgroundWorkersPlugin(mockFastify as FastifyInstance),
			).rejects.toThrow("Failed to start workers");
		});
	});

	describe("Graceful Shutdown", () => {
		it("should register onClose hook", async () => {
			await backgroundWorkersPlugin(mockFastify as FastifyInstance);

			expect(mockFastify.addHook).toHaveBeenCalledWith(
				"onClose",
				expect.any(Function),
			);
		});

		it("should log shutdown message when closing", async () => {
			await backgroundWorkersPlugin(mockFastify as FastifyInstance);

			// Get the onClose hook function
			const onCloseHook = (mockFastify.addHook as ReturnType<typeof vi.fn>).mock
				?.calls[0]?.[1];

			// Execute the hook
			await onCloseHook?.();

			expect(mockFastify.log?.info).toHaveBeenCalledWith(
				"Shutting down background workers...",
			);
		});

		it("should stop background workers on close", async () => {
			await backgroundWorkersPlugin(mockFastify as FastifyInstance);

			// Get the onClose hook function
			const onCloseHook = (mockFastify.addHook as ReturnType<typeof vi.fn>).mock
				?.calls[0]?.[1];

			// Execute the hook
			await onCloseHook?.();

			expect(stopBackgroundWorkers).toHaveBeenCalledWith(mockFastify.log);
		});

		it("should log success message after stopping workers", async () => {
			await backgroundWorkersPlugin(mockFastify as FastifyInstance);

			// Get the onClose hook function
			const onCloseHook = (mockFastify.addHook as ReturnType<typeof vi.fn>).mock
				?.calls[0]?.[1];

			// Execute the hook
			await onCloseHook?.();

			expect(mockFastify.log?.info).toHaveBeenCalledWith(
				"Background workers stopped successfully",
			);
		});

		it("should handle errors during worker shutdown", async () => {
			const shutdownError = new Error("Failed to stop workers");
			vi.mocked(stopBackgroundWorkers).mockRejectedValue(shutdownError);

			await backgroundWorkersPlugin(mockFastify as FastifyInstance);

			// Get the onClose hook function
			const onCloseHook = (mockFastify.addHook as ReturnType<typeof vi.fn>).mock
				?.calls[0]?.[1];

			// Execute the hook - should not throw
			await expect(onCloseHook?.()).rejects.toThrow("Failed to stop workers");
		});
	});

	describe("Plugin Export Configuration", () => {
		it("should export plugin wrapped with fastifyPlugin", () => {
			// Verify fastifyPlugin was called (the module import triggers it)
			expect(fastifyPluginMock).toHaveBeenCalled();
		});

		it("should export plugin with correct name", () => {
			// Check that fastifyPlugin was called with the correct name
			const pluginCall = fastifyPluginMock.mock.calls.find(
				(call) => (call[1] as { name?: string })?.name === "backgroundWorkers",
			);

			expect(pluginCall).toBeDefined();
			expect((pluginCall?.[1] as { name?: string })?.name).toBe(
				"backgroundWorkers",
			);
		});

		it("should export plugin with correct dependencies", () => {
			// Check that fastifyPlugin was called with dependencies
			const pluginCall = fastifyPluginMock.mock.calls.find((call) => {
				const options = call[1] as { dependencies?: string[] };
				return (
					options?.dependencies?.includes("drizzleClient") &&
					options?.dependencies?.includes("performance")
				);
			});

			expect(pluginCall).toBeDefined();
			expect(
				(pluginCall?.[1] as { dependencies?: string[] })?.dependencies,
			).toEqual(["drizzleClient", "performance"]);
		});
	});
});
