import type { Logger, LoggerOptions } from "pino";
import pino from "pino";

export type AppLogger = Logger;

const isTest = process.env.NODE_ENV === "test";
const isStaging = process.env.NODE_ENV === "staging";
/** Use pino-pretty only when explicitly enabled; production images omit pino-pretty (devDep). */
const usePinoPretty =
	process.env.API_IS_PINO_PRETTY === "true" ||
	process.env.API_IS_PINO_PRETTY === "1";

const redactPaths = [
	"host",
	"port",
	"user",
	"password",
	"clientSecret",
	"accessToken",
	"refreshToken",
];

export const loggerOptions: LoggerOptions = {
	level: process.env.LOG_LEVEL || "info",
	redact: {
		paths: redactPaths,
		remove: true,
	},
	transport:
		isTest ||
		isStaging ||
		!usePinoPretty ||
		(process.env.LOG_TRANSPORT_DISABLED === "true" &&
			process.env.NODE_ENV !== "test")
			? undefined
			: {
					target: "pino-pretty",
					options: {
						colorize: true,
					},
				},
};

export const rootLogger: AppLogger = pino(loggerOptions);

/**
 * Creates a child logger with additional fields
 * @param logger - The parent logger
 * @param fields - Additional fields to include in all logs
 * @returns A new logger instance
 */
export const withFields = (
	logger: AppLogger,
	fields: Record<string, unknown>,
): AppLogger => logger.child(fields);

export type { Logger };
