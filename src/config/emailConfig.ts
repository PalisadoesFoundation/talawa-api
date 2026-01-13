import { type Static, Type } from "@sinclair/typebox";
import { envSchema } from "env-schema";
import { envConfigSchema, envSchemaAjv } from "../envConfigSchema";

const schema = Type.Pick(envConfigSchema, [
	"AWS_SES_REGION",
	"AWS_SES_FROM_EMAIL",
	"AWS_SES_FROM_NAME",
	"AWS_ACCESS_KEY_ID",
	"AWS_SECRET_ACCESS_KEY",
	"API_EMAIL_PROVIDER",
]);

export type EmailEnvConfig = Static<typeof schema>;

export const rawEmailEnvConfig = envSchema<EmailEnvConfig>({
	ajv: envSchemaAjv,
	dotenv: true,
	schema,
});
