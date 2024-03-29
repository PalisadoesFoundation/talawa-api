import _ from "lodash";
import { createLogger, transports, format } from "winston";
import { getTracingId } from "./requestTracing";
import { appConfig } from "../config";

const { combine, printf, splat, colorize, simple, timestamp } = format;

// Colors make the log message more visible,
// adding the ability to focus or ignore messages.
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// This method set the current severity based on
// the current NODE_ENV: show all the log levels
// if the server was run in development mode; otherwise,
// if it was run in production, show only warn and error messages.
const level = (): string => {
  const env = process.env.NODE_ENV || "development";
  const isDevelopment = env === "development";
  return isDevelopment ? "debug" : "warn";
};

const formats = {
  colorized: combine(
    colorize({ all: true, colors }),
    splat(),
    simple(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    printf(
      (info) =>
        `${info.level || "-"} ${info.timestamp || "-"} ${
          getTracingId() || "-"
        } ${info.message} ${
          Object.keys(_.omit(info, ["level", "message", "stack", "timestamp"]))
            .length === 0
            ? ""
            : JSON.stringify(
                _.omit(info, ["level", "message", "stack", "timestamp"]),
              )
        } ${info.stack || ""}`,
    ),
  ),
  non_colorized: combine(
    splat(),
    simple(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    printf(
      (info) =>
        `${info.level || "-"} ${info.timestamp || "-"} ${
          getTracingId() || "-"
        } ${info.message} ${
          Object.keys(_.omit(info, ["level", "message", "stack", "timestamp"]))
            .length === 0
            ? ""
            : JSON.stringify(
                _.omit(info, ["level", "message", "stack", "timestamp"]),
              )
        } ${info.stack || ""}`,
    ),
  ),
};

const logger = createLogger({
  levels,
  level: level(),
  transports: [
    new transports.Console({
      level: appConfig.log_level,
      format:
        appConfig.colorize_logs === "true"
          ? formats.colorized
          : formats.non_colorized,
    }),
  ],
});

// The code block shifted before exporting logger
const stream = {
  write: (message: string | null): void => {
    logger.info((message || "").trim());
  },
};

export { logger, stream };
