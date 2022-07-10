import _ from 'lodash';
import { createLogger, transports, format } from 'winston';
import requestTracing from './request-tracing';
import { appConfig } from '../config';

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

export const logger = createLogger({
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

/* 
This piece of code is incorrect and seems pointless.
It should be removed after confirmation from the mentors.
For now typescript is ignoring it so that we don't get type errors.
*/
logger.stream = {
  // @ts-ignore
  write: (message) => {
    logger.info((message || '').trim());
  },
};

export default logger;
