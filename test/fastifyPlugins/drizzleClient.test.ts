import type { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock drizzle-orm
vi.mock("drizzle-orm/postgres-js", () => ({
	drizzle: vi.fn(() => ({
		execute: vi.fn().mockResolvedValue(undefined),
		$client: {
			end: vi.fn().mockResolvedValue(undefined),
		},
	})),
}));

// Mock migrate function
vi.mock("drizzle-orm/postgres-js/migrator", () => ({
	migrate: vi.fn(),
}));

// Mock schema
vi.mock("~/src/drizzle/schema", () => ({
	default: {},
}));

// Mock fastify-plugin
vi.mock("fastify-plugin", () => ({
	default: vi.fn((fn) => fn),
}));

import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzleClient } from "../../src/fastifyPlugins/drizzleClient";

// Type for mock Fastify instance
type MockFastifyInstance = Partial<FastifyInstance> & {
	log: {
		info: ReturnType<typeof vi.fn>;
		error: ReturnType<typeof vi.fn>;
	};
	envConfig: {
		API_IS_APPLY_DRIZZLE_MIGRATIONS: boolean;
		API_POSTGRES_DATABASE: string;
		API_POSTGRES_HOST: string;
		API_POSTGRES_PASSWORD: string;
		API_POSTGRES_PORT: number;
		API_POSTGRES_SSL_MODE: unknown;
		API_POSTGRES_USER: string;
	};
	decorate: ReturnType<typeof vi.fn>;
	addHook: ReturnType<typeof vi.fn>;
};

describe("drizzleClient Plugin - Migration Error Handling", () => {
	let mockFastify: MockFastifyInstance;

	beforeEach(() => {
		vi.clearAllMocks();

		mockFastify = {
			log: {
				info: vi.fn(),
				error: vi.fn(),
			},
			envConfig: {
				API_IS_APPLY_DRIZZLE_MIGRATIONS: true,
				API_POSTGRES_DATABASE: "test_db",
				API_POSTGRES_HOST: "localhost",
				API_POSTGRES_PASSWORD: "test_password",
				API_POSTGRES_PORT: 5432,
				API_POSTGRES_SSL_MODE: false,
				API_POSTGRES_USER: "test_user",
			},
			decorate: vi.fn(),
			addHook: vi.fn(),
		} as MockFastifyInstance;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("Migration Error Handling - Already Exists Errors", () => {
		it("should handle error with 'already exists' in message", async () => {
			const error = new Error("relation already exists");
			(migrate as ReturnType<typeof vi.fn>).mockRejectedValue(error);

			await drizzleClient(mockFastify as FastifyInstance);

			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Applying the drizzle migration files to the postgres database.",
			);
			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Migrations already applied or partially applied, continuing...",
			);
		});

		it("should handle error with code 42P06 (schema already exists)", async () => {
			const error = {
				code: "42P06",
				message: "schema already exists",
			};
			(migrate as ReturnType<typeof vi.fn>).mockRejectedValue(error);

			await drizzleClient(mockFastify as FastifyInstance);

			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Migrations already applied or partially applied, continuing...",
			);
		});

		it("should handle error with code 42P07 (relation already exists)", async () => {
			const error = {
				code: "42P07",
				message: "relation already exists",
			};
			(migrate as ReturnType<typeof vi.fn>).mockRejectedValue(error);

			await drizzleClient(mockFastify as FastifyInstance);

			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Migrations already applied or partially applied, continuing...",
			);
		});

		it("should handle error with code 42710 (duplicate object)", async () => {
			const error = {
				code: "42710",
				message: "duplicate object",
			};
			(migrate as ReturnType<typeof vi.fn>).mockRejectedValue(error);

			await drizzleClient(mockFastify as FastifyInstance);

			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Migrations already applied or partially applied, continuing...",
			);
		});

		it("should handle error with cause code 42P06", async () => {
			const error = {
				message: "Migration failed",
				cause: {
					code: "42P06",
					message: "schema already exists",
				},
			};
			(migrate as ReturnType<typeof vi.fn>).mockRejectedValue(error);

			await drizzleClient(mockFastify as FastifyInstance);

			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Migrations already applied or partially applied, continuing...",
			);
		});

		it("should handle error with cause code 42P07", async () => {
			const error = {
				message: "Migration failed",
				cause: {
					code: "42P07",
					message: "relation already exists",
				},
			};
			(migrate as ReturnType<typeof vi.fn>).mockRejectedValue(error);

			await drizzleClient(mockFastify as FastifyInstance);

			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Migrations already applied or partially applied, continuing...",
			);
		});

		it("should handle error with cause code 42710", async () => {
			const error = {
				message: "Migration failed",
				cause: {
					code: "42710",
					message: "duplicate object",
				},
			};
			(migrate as ReturnType<typeof vi.fn>).mockRejectedValue(error);

			await drizzleClient(mockFastify as FastifyInstance);

			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Migrations already applied or partially applied, continuing...",
			);
		});

		it("should handle error with '42P06' in message", async () => {
			const error = new Error("Error 42P06: schema already exists");
			(migrate as ReturnType<typeof vi.fn>).mockRejectedValue(error);

			await drizzleClient(mockFastify as FastifyInstance);

			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Migrations already applied or partially applied, continuing...",
			);
		});

		it("should handle error with '42P07' in message", async () => {
			const error = new Error("Error 42P07: relation already exists");
			(migrate as ReturnType<typeof vi.fn>).mockRejectedValue(error);

			await drizzleClient(mockFastify as FastifyInstance);

			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Migrations already applied or partially applied, continuing...",
			);
		});

		it("should handle error with '42710' in message", async () => {
			const error = new Error("Error 42710: duplicate object");
			(migrate as ReturnType<typeof vi.fn>).mockRejectedValue(error);

			await drizzleClient(mockFastify as FastifyInstance);

			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Migrations already applied or partially applied, continuing...",
			);
		});
	});

	describe("Migration Error Handling - Other Errors", () => {
		it("should re-throw non-already-exists errors", async () => {
			const error = new Error("Connection failed");
			(migrate as ReturnType<typeof vi.fn>).mockRejectedValue(error);

			await expect(
				drizzleClient(mockFastify as FastifyInstance),
			).rejects.toThrow(
				"Failed to apply the drizzle migrations to the postgres database.",
			);

			expect(mockFastify.log.info).not.toHaveBeenCalledWith(
				"Migrations already applied or partially applied, continuing...",
			);
		});

		it("should re-throw errors with different error codes", async () => {
			const error = {
				code: "08006",
				message: "Connection failure",
			};
			(migrate as ReturnType<typeof vi.fn>).mockRejectedValue(error);

			await expect(
				drizzleClient(mockFastify as FastifyInstance),
			).rejects.toThrow(
				"Failed to apply the drizzle migrations to the postgres database.",
			);
		});

		it("should handle non-Error objects", async () => {
			const error = "String error";
			(migrate as ReturnType<typeof vi.fn>).mockRejectedValue(error);

			await expect(
				drizzleClient(mockFastify as FastifyInstance),
			).rejects.toThrow(
				"Failed to apply the drizzle migrations to the postgres database.",
			);
		});
	});

	describe("Migration Success", () => {
		it("should log success when migrations complete without errors", async () => {
			(migrate as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

			await drizzleClient(mockFastify as FastifyInstance);

			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Applying the drizzle migration files to the postgres database.",
			);
			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Successfully applied the drizzle migrations to the postgres database.",
			);
		});
	});

	describe("Migration Disabled", () => {
		it("should skip migrations when API_IS_APPLY_DRIZZLE_MIGRATIONS is false", async () => {
			mockFastify.envConfig.API_IS_APPLY_DRIZZLE_MIGRATIONS = false;

			await drizzleClient(mockFastify as FastifyInstance);

			expect(migrate).not.toHaveBeenCalled();
			expect(mockFastify.log.info).not.toHaveBeenCalledWith(
				"Applying the drizzle migration files to the postgres database.",
			);
		});
	});

	describe("Database Connection", () => {
		it("should check database connection on startup", async () => {
			await drizzleClient(mockFastify as FastifyInstance);

			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Checking the connection to the postgres database.",
			);
			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Successfully connected to the postgres database.",
			);
		});

		it("should throw error if database connection fails", async () => {
			vi.clearAllMocks();

			// Mock drizzle to return a client with execute that rejects
			const mockDrizzleClient = {
				execute: vi.fn().mockRejectedValue(new Error("Connection failed")),
				$client: {
					end: vi.fn().mockResolvedValue(undefined),
				},
			};

			vi.mocked(drizzle).mockReturnValue(
				mockDrizzleClient as unknown as ReturnType<typeof drizzle>,
			);

			await expect(
				drizzleClient(mockFastify as FastifyInstance),
			).rejects.toThrow("Failed to connect to the postgres database.");

			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Checking the connection to the postgres database.",
			);
			expect(mockFastify.log.info).not.toHaveBeenCalledWith(
				"Successfully connected to the postgres database.",
			);
		});
	});

	describe("Connection Cleanup (onClose Hook)", () => {
		it("should register onClose hook and close database connection successfully", async () => {
			vi.clearAllMocks();

			await drizzleClient(mockFastify as FastifyInstance);

			expect(mockFastify.addHook).toHaveBeenCalledWith(
				"onClose",
				expect.any(Function),
			);

			const onCloseHook = (mockFastify.addHook as ReturnType<typeof vi.fn>).mock
				.calls[0]?.[1];
			expect(onCloseHook).toBeDefined();

			// Invoke the registered hook callback
			await onCloseHook?.();

			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Closing all the connections in the postgres connection pool.",
			);
			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Successfully closed all the connections in the postgres connection pool.",
			);
		});

		it("should handle errors during connection cleanup in onClose hook", async () => {
			vi.clearAllMocks();

			// Mock drizzle to return a client with $client.end that rejects
			const mockEnd = vi.fn().mockRejectedValue(new Error("Close failed"));
			const mockDrizzleClient = {
				execute: vi.fn().mockResolvedValue(undefined),
				$client: {
					end: mockEnd,
				},
			};

			vi.mocked(drizzle).mockReturnValue(
				mockDrizzleClient as unknown as ReturnType<typeof drizzle>,
			);

			await drizzleClient(mockFastify as FastifyInstance);

			const onCloseHook = (mockFastify.addHook as ReturnType<typeof vi.fn>).mock
				.calls[0]?.[1];

			// Invoke the registered hook callback
			await onCloseHook?.();

			expect(mockFastify.log.info).toHaveBeenCalledWith(
				"Closing all the connections in the postgres connection pool.",
			);
			expect(mockFastify.log.error).toHaveBeenCalledWith(
				{ error: expect.any(Error) },
				"Something went wrong while trying to close all the connections in the postgres connection pool.",
			);
			expect(mockFastify.log.info).not.toHaveBeenCalledWith(
				"Successfully closed all the connections in the postgres connection pool.",
			);
		});
	});

	describe("Fastify Decoration", () => {
		it("should decorate fastify instance with drizzleClient", async () => {
			vi.clearAllMocks();

			await drizzleClient(mockFastify as FastifyInstance);

			expect(mockFastify.decorate).toHaveBeenCalledWith(
				"drizzleClient",
				expect.any(Object),
			);

			// Verify the decorated client has the expected structure
			const decorateCall = (mockFastify.decorate as ReturnType<typeof vi.fn>).mock
				.calls.find((call) => call[0] === "drizzleClient");
			expect(decorateCall).toBeDefined();
			expect(decorateCall?.[1]).toBeDefined();
			expect(decorateCall?.[1]).toHaveProperty("execute");
			expect(decorateCall?.[1]).toHaveProperty("$client");
		});
	});
});
