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
  ENCRYPTION_KEY: z
    .string()
    .describe("Base64-encoded 32-byte encryption key for securing user emails")
    .refine((value) => {
      // Validate Base64 format and length
      try {
        const decoded = Buffer.from(value, "base64");
        return decoded.length === 32;
      } catch {
        return false;
      }
    }, "ENCRYPTION_KEY must be a valid Base64-encoded 32-byte string"),
  MINIO_ROOT_USER: z.string(),
  MINIO_ROOT_PASSWORD: z.string(),
  MINIO_BUCKET: z.string(),
  MINIO_ENDPOINT: z
    .string()
    .url()
    .refine((value: string) =>
      ["http://localhost:9000", "http://minio:9000"].includes(value),
    ),
});

export const getEnvIssues = (): z.ZodIssue[] | void => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    return result.error.issues;
  }
};
