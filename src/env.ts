import z from "zod";
export const envSchema = z.object({
  NODE_ENV: z
    .string()
    .refine((value) => ["development", "production"].includes(value)),
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
