import _ from "lodash";
import { createLogger, transports, format } from "winston";
import { getTracingId } from "./requestTracing";
import { appConfig } from "../config";

const { combine, printf, splat, colorize, simple, timestamp } = format;

const formats = {
  colorized: combine(
    colorize(),
    splat(),
    simple(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    printf(
      (info) =>
        `${info.level || "-"} ${info.timestamp || "-"} ${
          getTracingId() || "-"
        } ${info.message} ${
          JSON.stringify(
            _.omit(info, ["level", "message", "stack", "timestamp"])
          ) || "-"
        } ${info.stack || ""}`
    )
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
          JSON.stringify(
            _.omit(info, ["level", "message", "stack", "timestamp"])
          ) || "-"
        } ${info.stack || ""}`
    )
  ),
};

const logger = createLogger({
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
