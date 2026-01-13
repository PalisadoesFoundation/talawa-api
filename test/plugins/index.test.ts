import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { plugins } from "../../src/plugins/index";

// Type for mock Fastify instance
type MockFastifyInstance = Partial<FastifyInstance> & {
	register: ReturnType<typeof vi.fn>;
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
};

// Mock all the plugins
vi.mock("../../src/fastifyPlugins/drizzleClient", () => ({
	default: vi.fn(),
}));

vi.mock("../../src/fastifyPlugins/minioClient", () => ({
	default: vi.fn(),
}));

vi.mock("../../src/fastifyPlugins/performance", () => ({
	default: vi.fn(),
}));

vi.mock("../../src/fastifyPlugins/seedInitialData", () => ({
	default: vi.fn(),
}));

vi.mock("../../src/plugins/backgroundWorkers", () => ({
	default: vi.fn(),
}));

// Mock fastify-plugin
vi.mock("fastify-plugin", () => ({
	default: vi.fn((fn) => fn),
}));

import drizzleClient from "../../src/fastifyPlugins/drizzleClient";
import minioClient from "../../src/fastifyPlugins/minioClient";
import performance from "../../src/fastifyPlugins/performance";
import seedInitialData from "../../src/fastifyPlugins/seedInitialData";
import backgroundWorkers from "../../src/plugins/backgroundWorkers";

describe("Plugins Index", () => {
	let mockFastify: MockFastifyInstance;

	beforeEach(() => {
		vi.clearAllMocks();

		// Create mock fastify instance
		mockFastify = {
			register: vi.fn().mockResolvedValue(undefined),
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
		} as MockFastifyInstance;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Plugin Registration", () => {
		it("should register drizzleClient plugin first", async () => {
			await plugins(mockFastify as FastifyInstance);

			expect(mockFastify.register).toHaveBeenNthCalledWith(1, drizzleClient);
		});

		it("should register minioClient plugin second", async () => {
			await plugins(mockFastify as FastifyInstance);

			expect(mockFastify.register).toHaveBeenNthCalledWith(2, minioClient);
		});

		it("should register performance plugin third", async () => {
			await plugins(mockFastify as FastifyInstance);

			expect(mockFastify.register).toHaveBeenNthCalledWith(3, performance);
		});

		it("should register seedInitialData plugin fourth", async () => {
			await plugins(mockFastify as FastifyInstance);

			expect(mockFastify.register).toHaveBeenNthCalledWith(4, seedInitialData);
		});

		it("should register backgroundWorkers plugin last", async () => {
			await plugins(mockFastify as FastifyInstance);

			expect(mockFastify.register).toHaveBeenNthCalledWith(
				5,
				backgroundWorkers,
			);
		});

		it("should register performance plugin before backgroundWorkers", async () => {
			await plugins(mockFastify as FastifyInstance);

			const registerCalls = (mockFastify.register as ReturnType<typeof vi.fn>)
				.mock.calls;

			const performanceIndex = registerCalls.findIndex(
				(call) => call[0] === performance,
			);
			const backgroundWorkersIndex = registerCalls.findIndex(
				(call) => call[0] === backgroundWorkers,
			);

			expect(performanceIndex).toBeGreaterThan(-1);
			expect(backgroundWorkersIndex).toBeGreaterThan(-1);
			expect(performanceIndex).toBeLessThan(backgroundWorkersIndex);
		});

		it("should register all plugins in correct order", async () => {
			await plugins(mockFastify as FastifyInstance);

			expect(mockFastify.register).toHaveBeenCalledTimes(5);
			expect(mockFastify.register).toHaveBeenNthCalledWith(1, drizzleClient);
			expect(mockFastify.register).toHaveBeenNthCalledWith(2, minioClient);
			expect(mockFastify.register).toHaveBeenNthCalledWith(3, performance);
			expect(mockFastify.register).toHaveBeenNthCalledWith(4, seedInitialData);
			expect(mockFastify.register).toHaveBeenNthCalledWith(
				5,
				backgroundWorkers,
			);
		});

		it("should handle errors during plugin registration", async () => {
			const registrationError = new Error("Plugin registration failed");
			vi.mocked(mockFastify.register).mockRejectedValueOnce(registrationError);

			await expect(plugins(mockFastify as FastifyInstance)).rejects.toThrow(
				"Plugin registration failed",
			);
		});
	});
});
