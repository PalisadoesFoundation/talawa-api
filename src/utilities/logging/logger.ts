import * as pinoModule from "pino";

// biome-ignore lint/suspicious/noExplicitAny: Normalize pino module for ESM/CJS interop
const pino = (pinoModule as any).default || pinoModule;

import type { Logger, LoggerOptions } from "pino";

const level = process.env.LOG_LEVEL ?? "info";
const nodeEnv = process.env.NODE_ENV ?? "development";
const isDev = nodeEnv === "development";

const base: Record<string, unknown> = {
	service: "talawa-api",
	env: nodeEnv,
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

export const rootLogger: AppLogger = pino(loggerOptions);
