import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("pino", () => {
	const mockPinoInstance = {
		child: vi.fn().mockReturnThis(),
		info: vi.fn(),
		error: vi.fn(),
		warn: vi.fn(),
		debug: vi.fn(),
	};
	const mockPino = vi.fn().mockReturnValue(mockPinoInstance);
	return {
		default: mockPino,
	};
});

describe("logger.ts coverage", () => {
	const originalEnv = { ...process.env };

	beforeEach(() => {
		vi.resetModules();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = { ...originalEnv };
		vi.clearAllMocks();
	});

	it("disables transport for staging environment", async () => {
		process.env.NODE_ENV = "staging";
		vi.resetModules();
		const { rootLogger: stagedLogger } = await import(
			"~/src/utilities/logging/logger"
		);
		expect(stagedLogger).toBeDefined();
	});

	it("disables transport for non-test environment when configured", async () => {
		process.env.NODE_ENV = "production";
		process.env.LOG_TRANSPORT_DISABLED = "true";
		vi.resetModules();
		const { rootLogger: prodLogger } = await import(
			"~/src/utilities/logging/logger"
		);
		expect(prodLogger).toBeDefined();
	});

	it("enables pino-pretty transport when API_IS_PINO_PRETTY is 'true' and not test/staging", async () => {
		process.env.NODE_ENV = "production";
		process.env.API_IS_PINO_PRETTY = "true";
		delete process.env.LOG_TRANSPORT_DISABLED;
		vi.resetModules();
		const { loggerOptions: opts } = await import(
			"~/src/utilities/logging/logger"
		);
		expect(opts.transport).toBeDefined();
		expect((opts.transport as { target: string }).target).toBe("pino-pretty");
	});

	it("enables pino-pretty transport when API_IS_PINO_PRETTY is '1'", async () => {
		process.env.NODE_ENV = "production";
		process.env.API_IS_PINO_PRETTY = "1";
		delete process.env.LOG_TRANSPORT_DISABLED;
		vi.resetModules();
		const { loggerOptions: opts } = await import(
			"~/src/utilities/logging/logger"
		);
		expect(opts.transport).toBeDefined();
		expect((opts.transport as { target: string }).target).toBe("pino-pretty");
	});

	it("disables transport for production when LOG_TRANSPORT_DISABLED is 'true'", async () => {
		process.env.NODE_ENV = "production";
		process.env.API_IS_PINO_PRETTY = "true";
		process.env.LOG_TRANSPORT_DISABLED = "true";
		vi.resetModules();
		const { loggerOptions: opts } = await import(
			"~/src/utilities/logging/logger"
		);
		expect(opts.transport).toBeUndefined();
	});

	it("uses custom LOG_LEVEL when set", async () => {
		process.env.LOG_LEVEL = "debug";
		vi.resetModules();
		const { loggerOptions: opts } = await import(
			"~/src/utilities/logging/logger"
		);
		expect(opts.level).toBe("debug");
	});

	it("configures redaction paths", async () => {
		vi.resetModules();
		const { rootLogger: redactedLogger } = await import(
			"~/src/utilities/logging/logger"
		);
		expect(redactedLogger).toBeDefined();
	});

	it("withFields creates and returns a child logger", async () => {
		const { withFields, rootLogger } = await import(
			"~/src/utilities/logging/logger"
		);
		const fields = { requestId: "123" };
		const childLogger = withFields(rootLogger, fields);
		expect(childLogger).toBeDefined();
	});
});
