import z from "zod";

export const envSchema = z
  .object({
    ACCESS_TOKEN_SECRET: z.string(),
    REFRESH_TOKEN_SECRET: z.string(),
    MONGO_DB_URL: z.string().url(),

    RECAPTCHA_SECRET_KEY: z.string(),
    RECAPTCHA_SITE_KEY: z.string(),

    MAIL_USERNAME: z.string().email(),
    MAIL_PASSWORD: z.string(),

    apiKey: z.string(),
    appId: z.string(),
    messagingSenderId: z.string(),
    projectId: z.string(),
    storageBucket: z.string(),

    iOSapiKey: z.string(),
    iOSappId: z.string(),
    iOSmessagingSenderId: z.string(),
    iOSprojectId: z.string(),
    iOSstorageBucket: z.string(),
    iosClientId: z.string(),
    iosBundleId: z.string(),

    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  })
  .required();

export const getEnvIssues = (): z.ZodIssue[] | void => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) return result.error.issues;
};
