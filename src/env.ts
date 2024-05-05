import { type Static, Type } from "@sinclair/typebox";
import z from "zod";
import "dotenv/config";

export const envSchema = z.object({
  NODE_ENV: z
    .string()
    .refine((value) => ["development", "production"].includes(value)),
  SERVER_PORT: z.string(),
  ACCESS_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_SECRET: z.string(),
  MONGO_DB_URL: z.string().url(),
  RECAPTCHA_SECRET_KEY: z.string().optional(),
  MAIL_USERNAME: z.string().optional(),
  MAIL_PASSWORD: z.string().optional(),
  IS_SMTP: z
    .string()
    .refine((value) => ["true", "false", "null", ""].includes(value))
    .optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_USERNAME: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_SSL_TLS: z
    .string()
    .refine((value) => ["true", "false", ""].includes(value))
    .optional(),
  LAST_RESORT_SUPERADMIN_EMAIL: z.string().optional(),
  COLORIZE_LOGS: z
    .string()
    .refine((value) => ["true", "false", ""].includes(value))
    .optional(),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string().refine((value) => /^\d+$/.test(value)),
  REDIS_PASSWORD: z.string().optional(),
});

export const getEnvIssues = (): z.ZodIssue[] | void => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    return result.error.issues;
  }
};

/**
 * JSON schema of a record of environment variables accessible to the server at runtime.
 */
export const schema = Type.Object({
  ACCESS_TOKEN_SECRET: Type.String(),
  /**
   * @deprecated This environment variable is useless, will be removed in the future.
   */
  COLORIZE_LOGS: Type.Boolean({
    default: false,
  }),
  HOST: Type.String({
    default: "127.0.0.1",
  }),
  IS_SMTP: Type.Boolean({
    default: false,
  }),
  IS_SMTP_SSL_TLS: Type.Boolean({
    default: false,
  }),
  LAST_RESORT_SUPERADMIN_EMAIL: Type.Optional(Type.String()),
  LOG_LEVEL: Type.Enum(
    {
      debug: "debug",
      error: "error",
      fatal: "fatal",
      info: "info",
      trace: "trace",
      warn: "warn",
    },
    {
      default: "info",
    },
  ),
  MAIL_PASSWORD: Type.Optional(Type.String()),
  MAIL_USERNAME: Type.Optional(Type.String()),
  MONGO_DB_URI: Type.String(),
  NODE_ENV: Type.Enum(
    {
      development: "development",
      production: "production",
    },
    {
      default: "development",
    },
  ),
  PORT: Type.Optional(
    Type.Number({
      default: 3000,
    }),
  ),
  RECAPTCHA_SECRET_KEY: Type.Optional(Type.String()),
  REDIS_HOST: Type.String({
    default: "127.0.0.1",
  }),
  REDIS_PASSWORD: Type.Optional(Type.String()),
  REDIS_PORT: Type.Number({
    default: 6379,
  }),
  REFRESH_TOKEN_SECRET: Type.String(),
  SMTP_HOST: Type.Optional(Type.String()),
  SMTP_PASSWORD: Type.Optional(Type.String()),
  SMTP_PORT: Type.Number({
    default: 465,
  }),
  SMTP_USERNAME: Type.Optional(Type.String()),
});

export type Env = Static<typeof schema>;
