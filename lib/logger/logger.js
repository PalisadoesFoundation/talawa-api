const { createLogger, transports, format } = require('winston');
const requestTracing = require('request-tracing');
const _ = require('lodash');

const appConfig = require('../../config/app');

const { combine, printf, splat, colorize, simple, timestamp } = format;

const loggerFormat = printf((info) => {
  let formatObject = `${info.level || '-'} ${info.timestamp || '-'} ${
    requestTracing.getTracingId() || '-'
  } ${info.message} ${
    JSON.stringify(_.omit(info, ['level', 'message', 'stack', 'timestamp'])) ||
    '-'
  }`;

  if (info.stack) {
    formatObject += `\n${info.stack}`;
  }
  return formatObject;
});

const formats = {
  colorized: combine(
    colorize(),
    splat(),
    simple(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    loggerFormat
  ),
  non_colorized: combine(
    splat(),
    simple(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    loggerFormat
  ),
};

const logger = createLogger({
  transports: [
    new transports.Console({
      level: appConfig.log_level,
      format:
        appConfig.colorize_logs === 'true'
          ? formats.colorized
          : formats.non_colorized,
    }),
  ],
});

logger.stream = {
  write: (message) => {
    logger.info((message || '').trim());
  },
};
module.exports = logger;
