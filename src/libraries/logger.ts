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
      (info) =>`${info.level || "-"} ${info.timestamp || "-"} ${getTracingId() || "-"} ${info.message} ${JSON.stringify(_.omit(info, ["level", "message", "stack", "timestamp"])) || "-"} ${info.stack || ""}`
    )
  ),
  non_colorized: combine(
    splat(),
    simple(),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    printf(
      (info) =>`${info.level || "-"} ${info.timestamp || "-"} ${getTracingId() || "-"} ${info.message} ${JSON.stringify(_.omit(info, ["level", "message", "stack", "timestamp"])) || "-"} ${info.stack || ""}`
    )
  ),
};

const loggerFormat =
  appConfig.colorize_logs === "true"
    ? formats.colorized
    : formats.non_colorized;

const logger = createLogger({
  transports: [
    new transports.Console({
      level: appConfig.log_level,
      format: loggerFormat,
    }),
  ],
});

// The code block shifted before exporting logger
const stream = {
  // @ts-ignore
  write: (message) => {
    logger.info((message || "").trim());
  },
};

export { logger, stream };
