import type { MiddlewareInputContext, MiddlewareOptions } from "better-auth";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { auth } from "~/src/lib/auth";
import { db } from "~/src/lib/db";

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
describe("auth.hooks.after", () => {
	test("returns success for /sign-up", async () => {
		const jsonMock = vi.fn((data) => data);
		const ctx = {
			path: "/sign-up",
			context: {
				newSession: {
					user: { id: "user123" },
					session: { token: "token123" },
				},
			},
			json: jsonMock,
		} as MiddlewareInputContext<MiddlewareOptions>;
		const handler = auth.options.hooks.after;
		const result = await handler(ctx);
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
		const jsonMock = vi.fn((data) => data);
		const ctx = {
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
		} as MiddlewareInputContext<MiddlewareOptions>;
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
		const jsonMock = vi.fn((data) => data);
		const ctx = {
			path: "/sign-in",
			context: {},
			json: jsonMock,
		} as MiddlewareInputContext<MiddlewareOptions>;
		const result = await auth.options.hooks.after(ctx);
		expect(result).toEqual({
			statusCode: "10001",
			message: "No active session",
		});
	});

	test("returns failure on db error", async () => {
		const jsonMock = vi.fn((data) => data);
		vi.mocked(db.select).mockImplementationOnce(() => {
			throw new Error("DB fail");
		});

		const ctx = {
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
		} as MiddlewareInputContext<MiddlewareOptions>;
		const result = await auth.options.hooks.after(ctx);
		expect(result).toEqual({
			statusCode: "10001",
			message: "Failure",
			error: "DB fail",
		});
	});
});

describe("auth.hooks.after error handling", () => {
	const consoleErrorSpy = vi
		.spyOn(console, "error")
		.mockImplementation(() => {});

	beforeEach(() => {
		consoleErrorSpy.mockClear();
	});

	test("handles Error object correctly", async () => {
		const jsonMock = vi.fn((data) => data);
		const ctx = {
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
		} as MiddlewareInputContext<MiddlewareOptions>;
		vi.mocked(db.select).mockImplementationOnce(() => {
			throw new Error("Database connection failed");
		});
		const result = await auth.options.hooks.after(ctx);
		expect(consoleErrorSpy).toHaveBeenCalled();
		expect(result).toEqual({
			statusCode: "10001",
			message: "Failure",
			error: "Database connection failed",
		});
	});

	test("handles non-Error exceptions correctly", async () => {
		const jsonMock = vi.fn((data) => data);
		const ctx = {
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
		} as MiddlewareInputContext<MiddlewareOptions>;
		vi.mocked(db.select).mockImplementationOnce(() => {
			throw "String exception";
		});
		const result = await auth.options.hooks.after(ctx);
		expect(consoleErrorSpy).toHaveBeenCalled();
		expect(result).toEqual({
			statusCode: "10001",
			message: "Failure",
			error: "Unknown error",
		});
	});

	test("handles numeric exceptions correctly", async () => {
		const jsonMock = vi.fn((data) => data);
		const ctx = {
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
		} as MiddlewareInputContext<MiddlewareOptions>;
		vi.mocked(db.select).mockImplementationOnce(() => {
			throw 404;
		});
		const result = await auth.options.hooks.after(ctx);
		expect(consoleErrorSpy).toHaveBeenCalled();
		expect(result).toEqual({
			statusCode: "10001",
			message: "Failure",
			error: "Unknown error",
		});
	});
});
