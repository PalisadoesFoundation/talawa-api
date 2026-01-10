import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppLogger } from "~/src/utilities/logging/logger";

describe("logger.ts coverage", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		vi.resetModules();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = { ...originalEnv };
	});

	it("exports a valid rootLogger", async () => {
		process.env.NODE_ENV = "production";
		const { rootLogger } = await import("~/src/utilities/logging/logger");
		expect(rootLogger).toBeDefined();
		expect(typeof rootLogger.info).toBe("function");
	});

	it("configures transport for development environment (detailed)", async () => {
		process.env.NODE_ENV = "development";
		const { loggerOptions } = await import("~/src/utilities/logging/logger");

		expect(loggerOptions.transport).toMatchObject({
			target: "pino-pretty",
			options: {
				colorize: true,
				singleLine: true,
				translateTime: "SYS:standard",
			},
		});
	});

	it("disables transport for production environment", async () => {
		process.env.NODE_ENV = "production";
		const { loggerOptions } = await import("~/src/utilities/logging/logger");

		expect(loggerOptions.transport).toBeUndefined();
	});

	it("disables transport for test environment", async () => {
		process.env.NODE_ENV = "test";
		const { loggerOptions } = await import("~/src/utilities/logging/logger");

		expect(loggerOptions.transport).toBeUndefined();
	});

	it("disables transport for staging environment", async () => {
		process.env.NODE_ENV = "staging";
		const { loggerOptions } = await import("~/src/utilities/logging/logger");

		expect(loggerOptions.transport).toBeUndefined();
	});

	it("configures redaction paths", async () => {
		const { loggerOptions } = await import("~/src/utilities/logging/logger");
		expect(loggerOptions.redact).toEqual({
			paths: [
				"req.headers.authorization",
				"req.headers.cookie",
				"password",
				"credentials",
				"token",
			],
			remove: true,
		});
	});

	it("withFields creates and returns a child logger", async () => {
		const { withFields } = await import("~/src/utilities/logging/logger");

		const mockChild = { info: vi.fn() };
		const mockLogger = {
			child: vi.fn().mockReturnValue(mockChild),
		};

		const result = withFields(mockLogger as unknown as AppLogger, {
			foo: "bar",
		});

		expect(mockLogger.child).toHaveBeenCalledWith({ foo: "bar" });
		expect(result).toBe(mockChild);
	});
});
