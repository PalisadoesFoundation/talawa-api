import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppLogger } from "~/src/utilities/logging/logger";

describe("logger.ts coverage", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetModules();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("configures transport for development environment", async () => {
		process.env.NODE_ENV = "development";
		// Reload module to pick up env change
		const { loggerOptions } = await import("~/src/utilities/logging/logger");

		expect(loggerOptions.transport).toBeDefined();
		expect(loggerOptions.transport).toMatchObject({
			target: "pino-pretty",
			options: {
				colorize: true,
			},
		});
	});

	it("disables transport for production environment", async () => {
		process.env.NODE_ENV = "production";
		// Reload module
		const { loggerOptions } = await import("~/src/utilities/logging/logger");

		expect(loggerOptions.transport).toBeUndefined();
	});

	it("withFields creates a child logger", async () => {
		const { withFields } = await import("~/src/utilities/logging/logger");
		const mockLogger = {
			child: vi.fn().mockReturnThis(),
		};

		const result = withFields(mockLogger as unknown as AppLogger, {
			foo: "bar",
		});

		expect(mockLogger.child).toHaveBeenCalledWith({ foo: "bar" });
		expect(result).toBe(mockLogger);
	});
});
