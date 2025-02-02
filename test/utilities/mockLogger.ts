import type { FastifyBaseLogger } from "fastify";
import { vi } from "vitest";

export const createMockLogger = (): FastifyBaseLogger => {
	const logger = {
		error: vi.fn(),
		warn: vi.fn(),
		info: vi.fn(),
		debug: vi.fn(),
		trace: vi.fn(),
		fatal: vi.fn(),
		silent: vi.fn(),
		child: () => createMockLogger(),
		level: "info",
		isLevelEnabled: vi.fn().mockReturnValue(true),
		bindings: vi.fn().mockReturnValue({}),
		flush: vi.fn(),
		isFatalEnabled: vi.fn().mockReturnValue(true),
		isErrorEnabled: vi.fn().mockReturnValue(true),
		isWarnEnabled: vi.fn().mockReturnValue(true),
		isInfoEnabled: vi.fn().mockReturnValue(true),
		isDebugEnabled: vi.fn().mockReturnValue(true),
		isTraceEnabled: vi.fn().mockReturnValue(true),
		isSilentEnabled: vi.fn().mockReturnValue(true),
	};

	return logger as unknown as FastifyBaseLogger;
};
