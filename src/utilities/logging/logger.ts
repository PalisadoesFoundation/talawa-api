import type { Logger, LoggerOptions } from "pino";

const level = process.env.LOG_LEVEL ?? "info";
const isDev = process.env.NODE_ENV !== "production";

const base: Record<string, unknown> = {
	service: "talawa-api",
	env: process.env.NODE_ENV ?? "development",
	version: process.env.APP_VERSION ?? "0.0.0",
};

export const loggerOptions: LoggerOptions = {
	level,
	base,
	// Redact common sensitive fields (extend as needed)
	redact: {
		paths: [
			"req.headers.authorization",
			"req.headers.cookie",
			"password",
			"credentials",
			"token",
		],
		remove: true,
	},
	transport: isDev
		? {
				target: "pino-pretty",
				options: {
					colorize: true,
					singleLine: true,
					translateTime: "SYS:standard",
				},
			}
		: undefined,
};

export type AppLogger = Logger;

// Helper to safely attach fields without mutating the original logger
export const withFields = (
	logger: AppLogger,
	fields: Record<string, unknown>,
): AppLogger => logger.child(fields);
