import _ from "lodash";
import { createLogger, transports, format } from "winston";
import { getTracingId } from "./requestTracing";
import { appConfig } from "../config";

// Destructure the necessary format functions from winston.format
const { combine, printf, splat, colorize, simple, timestamp } = format;

// Define log formats with and without colorization
const formats = {
  colorized: combine(
    colorize(), // Add colors to log levels
    splat(), // Allow string interpolation in log messages
    simple(), // Simplify log message format
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), // Add timestamp in specified format
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
        } ${info.stack || ""}`, // Custom log message format
    ),
  ),
  non_colorized: combine(
    splat(), // Allow string interpolation in log messages
    simple(), // Simplify log message format
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), // Add timestamp in specified format
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
        } ${info.stack || ""}`, // Custom log message format
    ),
  ),
};

// Create a Winston logger with a console transport
const logger = createLogger({
  transports: [
    new transports.Console({
      level: appConfig.log_level, // Set log level from app configuration
      format:
        appConfig.colorize_logs === "true"
          ? formats.colorized // Use colorized format if enabled in config
          : formats.non_colorized, // Use non-colorized format otherwise
    }),
  ],
});

// Define a stream for use with other logging systems, such as morgan
const stream = {
  write: (message: string | null): void => {
    logger.info((message || "").trim()); // Log the message using the info level
  },
};

// Export the logger and stream
export { logger, stream };
