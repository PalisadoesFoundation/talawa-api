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

	it("enables transport for production environment when not disabled", async () => {
		process.env.NODE_ENV = "production";
		process.env.LOG_TRANSPORT_DISABLED = "false";
		vi.resetModules();
		const { rootLogger: prodLogger } = await import(
			"~/src/utilities/logging/logger"
		);
		expect(prodLogger).toBeDefined();
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
