import { envSchema } from "env-schema";
import { type Static, Type } from "typebox";
import { envConfigSchema, envSchemaAjv } from "../envConfigSchema";

const schema = Type.Pick(envConfigSchema, [
	"AWS_SES_REGION",
	"AWS_SES_FROM_EMAIL",
	"AWS_SES_FROM_NAME",
	"AWS_ACCESS_KEY_ID",
	"AWS_SECRET_ACCESS_KEY",
]);

const envConfig = envSchema<Static<typeof schema>>({
	ajv: envSchemaAjv,
	dotenv: true,
	schema,
});

/**
 * Email configuration from environment variables
 */
export const emailConfig = {
	region: envConfig.AWS_SES_REGION || "ap-south-1",
	fromEmail: envConfig.AWS_SES_FROM_EMAIL,
	fromName: envConfig.AWS_SES_FROM_NAME || "Talawa",
	accessKeyId: envConfig.AWS_ACCESS_KEY_ID,
	secretAccessKey: envConfig.AWS_SECRET_ACCESS_KEY,
};
