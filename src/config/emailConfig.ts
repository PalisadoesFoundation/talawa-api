import { envSchema } from "env-schema";
import { type Static, Type } from "typebox";
import { envConfigSchema, envSchemaAjv } from "../envConfigSchema";

const schema = Type.Pick(envConfigSchema, [
	"AWS_SES_REGION",
	"AWS_SES_FROM_EMAIL",
	"AWS_SES_FROM_NAME",
	"AWS_ACCESS_KEY_ID",
	"AWS_SECRET_ACCESS_KEY",
	"API_EMAIL_PROVIDER",
	"SMTP_HOST",
	"SMTP_PORT",
	"SMTP_USER",
	"SMTP_PASSWORD",
	"SMTP_SECURE",
	"SMTP_FROM_EMAIL",
	"SMTP_FROM_NAME",
	"SMTP_NAME",
	"SMTP_LOCAL_ADDRESS",
]);

export type EmailEnvConfig = Static<typeof schema>;

export const rawEmailEnvConfig = envSchema<EmailEnvConfig>({
	ajv: envSchemaAjv,
	dotenv: true,
	schema,
});
