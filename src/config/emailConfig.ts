import { envSchema } from "env-schema";
import { type Static, Type } from "typebox";
import { envConfigSchema, envSchemaAjv } from "../envConfigSchema";

const schema = Type.Pick(envConfigSchema, [
	"API_AWS_SES_REGION",
	"API_AWS_SES_FROM_EMAIL",
	"API_AWS_SES_FROM_NAME",
	"API_AWS_ACCESS_KEY_ID",
	"API_AWS_SECRET_ACCESS_KEY",
	"API_EMAIL_PROVIDER",
	"API_SMTP_HOST",
	"API_SMTP_PORT",
	"API_SMTP_USER",
	"API_SMTP_PASSWORD",
	"API_SMTP_SECURE",
	"API_SMTP_FROM_EMAIL",
	"API_SMTP_FROM_NAME",
	"API_SMTP_NAME",
	"API_SMTP_LOCAL_ADDRESS",
]);

export type EmailEnvConfig = Static<typeof schema>;

export const rawEmailEnvConfig = envSchema<EmailEnvConfig>({
	ajv: envSchemaAjv,
	dotenv: true,
	schema,
});
