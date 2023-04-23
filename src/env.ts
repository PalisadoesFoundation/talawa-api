import z from "zod";

export const envSchema = z
  .object({
    ACCESS_TOKEN_SECRET: z.string().nonempty(),
    REFRESH_TOKEN_SECRET: z.string().nonempty(),
    MONGO_DB_URL: z.string().url(),

    RECAPTCHA_SECRET_KEY: z.string().nonempty(),
    RECAPTCHA_SITE_KEY: z.string().nonempty(),

    MAIL_USERNAME: z.string().email().nonempty(),
    MAIL_PASSWORD: z.string().nonempty(),

    apiKey: z.string().nonempty(),
    appId: z.string().nonempty(),
    messagingSenderId: z.string().nonempty(),
    projectId: z.string().nonempty(),
    storageBucket: z.string().nonempty(),

    iOSapiKey: z.string().nonempty(),
    iOSappId: z.string().nonempty(),
    iOSmessagingSenderId: z.string().nonempty(),
    iOSprojectId: z.string().nonempty(),
    iOSstorageBucket: z.string().nonempty(),
    iosClientId: z.string().nonempty(),
    iosBundleId: z.string().nonempty(),

    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
  })
  .required();

export const getEnvIssues = (): z.ZodIssue[] | void => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) return result.error.issues;
};
