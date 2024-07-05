/**
 * Application configuration settings.
 * This object contains various configuration options for the application.
 */
export const appConfig = {
  /** The current environment of the application (e.g., 'development', 'production'). */
  env: process.env.NODE_ENV,

  /** Determines if logs should be colorized. */
  colorize_logs: process.env.COLORIZE_LOGS,

  /** The logging level for the application (e.g., 'info', 'error'). */
  log_level: process.env.LOG_LEVEL,

  /** The default language for the application. */
  defaultLocale: "en",

  /** An array of supported language for the application. */
  supportedLocales: ["hi", "en", "zh", "fr", "sp"],
};
