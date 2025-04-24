import { beforeEach, describe, expect, test, vi } from "vitest";
import { auth } from "~/src/lib/auth";
import { db } from "~/src/lib/db";

// Mock db.select for /sign-in
vi.mock("~/src/lib/db", async () => {
	const actual =
		await vi.importActual<typeof import("~/src/lib/db")>("~/src/lib/db");
	return {
		...actual,
		db: {
			select: vi.fn(() => ({
				from: () => ({
					where: () => [
						{
							role: "admin",
							countryCode: "IN",
							avatarName: "avatar123",
						},
					],
				}),
			})),
		},
	};
});
interface AuthContext {
	path: string;
	context: {
		newSession?: {
			user: {
				id: string;
				email: string;
				name: string;
			};
			session: {
				token: string;
			};
		};
	};
	json: (data: unknown) => void;
}
describe("auth.hooks.after", () => {
	// let jsonMock: ReturnType<typeof vi.fn>;

	// beforeEach(() => {
	//     jsonMock = vi.fn();
	// });

	test("returns success for /sign-up", async () => {
		// Create a spy for json method
		const jsonMock = vi.fn((data) => data);

		// Create context object with the json spy method
		// biome-ignore lint/suspicious/noExplicitAny: We need flexibility for testing
		const ctx: any = {
			path: "/sign-up",
			context: {
				newSession: {
					user: { id: "user123" },
					session: { token: "token123" },
				},
			},
			json: jsonMock,
		};

		// Get the handler function
		const handler = auth.options.hooks.after;

		// Execute the handler with our mocked context
		const result = await handler(ctx);

		// Instead of checking if the mock was called, verify the returned result
		expect(result).toEqual({
			statusCode: "10000",
			message: "Success",
			data: {
				token: "token123",
				id: "user123",
			},
		});
	});

	test("returns user details for /sign-in", async () => {
		// Create a spy for json method
		const jsonMock = vi.fn((data) => data);
		// biome-ignore lint/suspicious/noExplicitAny: We need flexibility for testing
		const ctx: any = {
			path: "/sign-in",
			context: {
				newSession: {
					user: {
						id: "user123",
						email: "test@example.com",
						name: "Test User",
					},
					session: { token: "token456" },
				},
			},
			json: jsonMock,
		};

		// Execute the handler and check result
		const result = await auth.options.hooks.after(ctx);

		expect(result).toEqual({
			statusCode: "10000",
			message: "Success",
			data: {
				token: "token456",
				id: "user123",
				email: "test@example.com",
				name: "Test User",
				role: "admin",
				countryCode: "IN",
				avatarName: "avatar123",
			},
		});
	});

	test("returns error when no session", async () => {
		// Create a spy for json method
		const jsonMock = vi.fn((data) => data);
		// biome-ignore lint/suspicious/noExplicitAny: We need flexibility for testing
		const ctx: any = {
			path: "/sign-in",
			context: {},
			json: jsonMock,
		};

		// Execute the handler and check result
		const result = await auth.options.hooks.after(ctx);

		expect(result).toEqual({
			statusCode: "10001",
			message: "No active session",
		});
	});

	test("returns failure on db error", async () => {
		// Create a spy for json method
		const jsonMock = vi.fn((data) => data);

		// Mock DB error
		vi.mocked(db.select).mockImplementationOnce(() => {
			throw new Error("DB fail");
		});
		// biome-ignore lint/suspicious/noExplicitAny: We need flexibility for testing
		const ctx: any = {
			path: "/sign-in",
			context: {
				newSession: {
					user: {
						id: "user123",
						email: "test@example.com",
						name: "Test User",
					},
					session: { token: "token789" },
				},
			},
			json: jsonMock,
		};

		// Execute the handler and check result
		const result = await auth.options.hooks.after(ctx);

		expect(result).toEqual({
			statusCode: "10001",
			message: "Failure",
			error: "DB fail",
		});
	});
});

describe("auth.hooks.after error handling", () => {
	// Spy on console.error to verify it's called during error handling
	const consoleErrorSpy = vi
		.spyOn(console, "error")
		.mockImplementation(() => {});

	beforeEach(() => {
		// Clear the mock before each test
		consoleErrorSpy.mockClear();
	});

	test("handles Error object correctly", async () => {
		// Create a spy for json method
		const jsonMock = vi.fn((data) => data);

		// Create context object that accesses newSession normally
		// biome-ignore lint/suspicious/noExplicitAny: We need flexibility for testing
		const ctx: any = {
			path: "/sign-in",
			context: {
				newSession: {
					user: {
						id: "user123",
						email: "test@example.com",
						name: "Test User",
					},
					session: { token: "token789" },
				},
			},
			json: jsonMock,
		};

		// Force db.select to throw an Error object with a specific message
		vi.mocked(db.select).mockImplementationOnce(() => {
			throw new Error("Database connection failed");
		});

		// Execute the handler and check result
		const result = await auth.options.hooks.after(ctx);

		// Verify console.error was called
		expect(consoleErrorSpy).toHaveBeenCalled();

		// Verify the error response format with the specific error message
		expect(result).toEqual({
			statusCode: "10001",
			message: "Failure",
			error: "Database connection failed",
		});
	});

	test("handles non-Error exceptions correctly", async () => {
		// Create a spy for json method
		const jsonMock = vi.fn((data) => data);

		// Create context object
		// biome-ignore lint/suspicious/noExplicitAny: We need flexibility for testing
		const ctx: any = {
			path: "/sign-in",
			context: {
				newSession: {
					user: {
						id: "user123",
						email: "test@example.com",
						name: "Test User",
					},
					session: { token: "token789" },
				},
			},
			json: jsonMock,
		};

		// Force db.select to throw a string instead of an Error object
		vi.mocked(db.select).mockImplementationOnce(() => {
			throw "String exception";
		});

		// Execute the handler and check result
		const result = await auth.options.hooks.after(ctx);

		// Verify console.error was called
		expect(consoleErrorSpy).toHaveBeenCalled();

		// Verify the error response format matches the actual implementation
		expect(result).toEqual({
			statusCode: "10001",
			message: "Failure",
			error: "Unknown error", // Updated to match actual implementation
		});
	});

	test("handles numeric exceptions correctly", async () => {
		// Create a spy for json method
		const jsonMock = vi.fn((data) => data);

		// Create context object
		// biome-ignore lint/suspicious/noExplicitAny: We need flexibility for testing
		const ctx: any = {
			path: "/sign-in",
			context: {
				newSession: {
					user: {
						id: "user123",
						email: "test@example.com",
						name: "Test User",
					},
					session: { token: "token789" },
				},
			},
			json: jsonMock,
		};

		// Force db.select to throw a number instead of an Error object
		vi.mocked(db.select).mockImplementationOnce(() => {
			throw 404;
		});

		// Execute the handler and check result
		const result = await auth.options.hooks.after(ctx);

		// Verify console.error was called
		expect(consoleErrorSpy).toHaveBeenCalled();

		// Verify the error response format - for non-Error objects, it will be "Unknown error"
		expect(result).toEqual({
			statusCode: "10001",
			message: "Failure",
			error: "Unknown error", // Updated to match actual implementation
		});
	});
});
