import type { FastifyBaseLogger } from "fastify";
import { vi } from "vitest";

/**
 * Configuration options for the mock logger.
 * @interface MockLoggerConfig
 * @property {string} [level] - The logging level to use. Defaults to "info".
 * @property {Set<string>} [enabledLevels] - Set of enabled log levels.
 */

interface MockLoggerConfig {
	level?: string;
	enabledLevels?: Set<string>;
}

export const createMockLogger = (
	config?: MockLoggerConfig,
): FastifyBaseLogger => {
	const level = config?.level ?? "info";
	const enabledLevels =
		config?.enabledLevels ??
		new Set(["error", "warn", "info", "debug", "trace", "fatal", "silent"]);

	if (level && !enabledLevels.has(level)) {
		throw new Error(`Invalid log level: ${level}`);
	}

	const logger = {
		error: vi.fn(),
		warn: vi.fn(),
		info: vi.fn(),
		debug: vi.fn(),
		trace: vi.fn(),
		fatal: vi.fn(),
		silent: vi.fn(),
		child: () => createMockLogger(config),
		level,
		isLevelEnabled: (l: string) => enabledLevels.has(l),
		bindings: vi.fn().mockReturnValue({}),
		flush: vi.fn(),
		isFatalEnabled: () => enabledLevels.has("fatal"),
		isErrorEnabled: () => enabledLevels.has("error"),
		isWarnEnabled: () => enabledLevels.has("warn"),
		isInfoEnabled: () => enabledLevels.has("info"),
		isDebugEnabled: () => enabledLevels.has("debug"),
		isTraceEnabled: () => enabledLevels.has("trace"),
		isSilentEnabled: () => enabledLevels.has("silent"),
	};

	return logger;
};
