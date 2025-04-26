import postgres from "postgres";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("dotenv", async () => {
	const actual = await vi.importActual("dotenv");
	return {
		...actual,
		config: vi.fn(),
	};
});

const mockExit = vi.fn();
const mockOn = vi.fn();
const mockProcess = {
	env: {
		API_POSTGRES_USER: "testuser",
		API_POSTGRES_PASSWORD: "password",
		API_POSTGRES_HOST: "localhost",
		API_POSTGRES_PORT: "5432",
		API_POSTGRES_DATABASE: "testdb",
		API_POSTGRES_SSL_MODE: "false",
		NODE_ENV: "test",
	},
	exit: mockExit,
	on: mockOn,
	cwd: process.cwd,
};

vi.stubGlobal("process", mockProcess);
const mockEnd = vi.fn().mockResolvedValue(undefined);
const mockPostgresClient = {
	end: mockEnd,
};
vi.mock("postgres", () => ({
	default: vi.fn(() => mockPostgresClient),
}));
const mockConsoleLog = vi.fn();
const mockConsoleError = vi.fn();
vi.spyOn(console, "log").mockImplementation(mockConsoleLog);
vi.spyOn(console, "error").mockImplementation(mockConsoleError);
vi.mock("drizzle-orm/postgres-js", () => ({
	drizzle: vi.fn(() => ({})),
}));

describe("Database Configuration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockProcess.env.NODE_ENV = "test";
		mockProcess.env.API_POSTGRES_SSL_MODE = "false";
	});

	afterEach(() => {
		vi.resetModules();
	});

	test("configures SSL when API_POSTGRES_SSL_MODE is true", async () => {
		mockProcess.env.API_POSTGRES_SSL_MODE = "true";
		await import("~/src/lib/db");
		expect(postgres).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({
				ssl: "allow",
			}),
		);
	});

	test("does not enable SSL when API_POSTGRES_SSL_MODE is false", async () => {
		mockProcess.env.API_POSTGRES_SSL_MODE = "false";
		await import("~/src/lib/db");
		expect(postgres).toHaveBeenCalledWith(
			expect.any(String),
			expect.objectContaining({
				ssl: undefined,
			}),
		);
	});

	test("adds debug logging in development environment", async () => {
		mockProcess.env.NODE_ENV = "development";
		await import("~/src/lib/db");
		const mockcalls = vi.mocked(postgres).mock.calls[0];
		type PostgresOptions = {
			debug?:
				| boolean
				| ((
						connection: number,
						query: string,
						parameters: unknown[],
						paramTypes: unknown[],
				  ) => void);
		};
		let postgresOptions: PostgresOptions | undefined;
		if (mockcalls) {
			postgresOptions = mockcalls[1];
		}
		expect(postgresOptions).toHaveProperty("debug");
		expect(mockConsoleLog).toHaveBeenCalledWith(
			"Database connected successfully",
		);
	});

	test("does not add debug logging in non-development environments", async () => {
		mockProcess.env.NODE_ENV = "production";
		await import("~/src/lib/db");
		const postgresOptions = vi.mocked(postgres).mock.calls[0] ? [1] : "";
		expect(postgresOptions).not.toHaveProperty("debug");
	});

	test("graceful shutdown closes database connections", async () => {
		await import("~/src/lib/db");
		const shutdownCalls = mockOn.mock.calls.find(
			(call) => call[0] === "SIGINT",
		);
		let shutdownHandler: (() => Promise<void>) | undefined;
		if (shutdownCalls) {
			shutdownHandler = shutdownCalls[1];
		}
		if (shutdownHandler) {
			await shutdownHandler();
		}
		expect(mockConsoleLog).toHaveBeenCalledWith(
			"Closing database connections...",
		);
		expect(mockConsoleLog).toHaveBeenCalledWith("Database connections closed.");
		expect(mockEnd).toHaveBeenCalled();
		expect(mockExit).toHaveBeenCalledWith(0);
	});

	test("handles errors during database connection shutdown", async () => {
		const shutdownError = new Error("Failed to close connection");
		mockEnd.mockRejectedValueOnce(shutdownError);
		await import("~/src/lib/db");
		const shutdownCalls = mockOn.mock.calls.find(
			(call) => call[0] === "SIGINT",
		);
		let shutdownHandler: (() => Promise<void>) | undefined;

		if (shutdownCalls) {
			shutdownHandler = shutdownCalls[1];
		}
		if (shutdownHandler) {
			await shutdownHandler();
		}
		expect(mockConsoleError).toHaveBeenCalledWith(
			"❌ Error closing database connections:",
			shutdownError,
		);
		expect(mockExit).toHaveBeenCalledWith(0);
	});
});
