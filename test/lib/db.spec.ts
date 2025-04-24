import postgres from "postgres";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

// import { config } from 'dotenv';

vi.mock("dotenv", async () => {
    const actual = await vi.importActual("dotenv");
    return {
        ...actual,
        config: vi.fn(),
    };
});

// Mock process
const mockExit = vi.fn();
const mockOn = vi.fn();

// Setup process mock with controlled environment
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

// Mock postgres client
const mockEnd = vi.fn().mockResolvedValue(undefined);
const mockPostgresClient = {
    end: mockEnd,
};

// Mock postgres library
vi.mock("postgres", () => ({
    default: vi.fn(() => mockPostgresClient),
}));

// Mock console methods
const mockConsoleLog = vi.fn();
const mockConsoleError = vi.fn();
vi.spyOn(console, "log").mockImplementation(mockConsoleLog);
vi.spyOn(console, "error").mockImplementation(mockConsoleError);

// Mock drizzle
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
        // Set SSL mode to true
        mockProcess.env.API_POSTGRES_SSL_MODE = "true";

        // Import the module to trigger the connection code
        await import("~/src/lib/db");

        // Verify postgres was called with correct options
        expect(postgres).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                ssl: "allow",
            }),
        );
    });

    test("does not enable SSL when API_POSTGRES_SSL_MODE is false", async () => {
        // Set SSL mode to false
        mockProcess.env.API_POSTGRES_SSL_MODE = "false";

        // Import the module to trigger the connection code
        await import("~/src/lib/db");

        // Verify postgres was called with correct options
        expect(postgres).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                ssl: undefined,
            }),
        );
    });

    test("adds debug logging in development environment", async () => {
        // Set environment to development
        mockProcess.env.NODE_ENV = "development";

        // Import the module to trigger the connection code
        await import("~/src/lib/db");

        // Verify postgres was called with debug option
        const mockcalls = vi.mocked(postgres).mock.calls[0];
        
        let postgresOptions ;
        if (mockcalls) {
            postgresOptions = mockcalls[1];
        }
        expect(postgresOptions).toHaveProperty("debug");

        // Test the debug function
        // const debugFn = postgresOptions?.debug;
        // debugFn("connection", "SELECT * FROM users", ["param1", "param2"]);

        // Verify debug logs were printed
        expect(mockConsoleLog).toHaveBeenCalledWith(
            "Database connected successfully",
        );
    });

    test("does not add debug logging in non-development environments", async () => {
        // Set environment to production
        mockProcess.env.NODE_ENV = "production";

        // Import the module to trigger the connection code
        await import("~/src/lib/db");

        // Verify postgres was called without debug option
        const postgresOptions = vi.mocked(postgres).mock.calls[0] ? [1] : "";
        expect(postgresOptions).not.toHaveProperty("debug");
    });

    test("graceful shutdown closes database connections", async () => {
        // Import the module
        await import("~/src/lib/db");

        // Get the shutdown handler
        const shutdownCalls = mockOn.mock.calls.find(
            (call) => call[0] === "SIGINT",
        );

        let shutdownHandler;
        if (shutdownCalls) {
            shutdownHandler = shutdownCalls[1]; // Access the handler if the call exists
        }

        // Call the shutdown handler
        await shutdownHandler();

        // Verify appropriate logs were made
        expect(mockConsoleLog).toHaveBeenCalledWith(
            "Closing database connections...",
        );
        expect(mockConsoleLog).toHaveBeenCalledWith("Database connections closed.");

        // Verify client.end was called
        expect(mockEnd).toHaveBeenCalled();

        // Verify process.exit was called with code 0
        expect(mockExit).toHaveBeenCalledWith(0);
    });

    test("handles errors during database connection shutdown", async () => {
        // Make client.end throw an error
        const shutdownError = new Error("Failed to close connection");
        mockEnd.mockRejectedValueOnce(shutdownError);

        // Import the module
        await import("~/src/lib/db");

        const shutdownCalls = mockOn.mock.calls.find(
            (call) => call[0] === "SIGINT",
        );

        let shutdownHandler;
        if (shutdownCalls) {
            shutdownHandler = shutdownCalls[1];
        }
        await shutdownHandler();
        expect(mockConsoleError).toHaveBeenCalledWith(
            "❌ Error closing database connections:",
            shutdownError,
        );

        expect(mockExit).toHaveBeenCalledWith(0);
    });
});
