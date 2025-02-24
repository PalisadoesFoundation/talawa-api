import { type Static, Type } from "@sinclair/typebox";
import ajvFormats from "ajv-formats";
import type { EnvSchemaOpt } from "env-schema";

/**
 * JSON schema of a record of environment variables accessible to the talawa api at runtime.
 */
export const envConfigSchema = Type.Object({
	/**
	 * Email address of the user with "administrator" role that is guaranteed to exist in the postgres database at the startup time of talawa api.
	 */
	API_ADMINISTRATOR_USER_EMAIL_ADDRESS: Type.String({
		format: "email",
	}),
	/**
	 * Email address of the user with "administrator" role that is guaranteed to exist in the postgres database at the startup time of talawa api.
	 */
	API_ADMINISTRATOR_USER_NAME: Type.String({
		minLength: 1,
		maxLength: 256,
	}),
	/**
	 * Password of the user with "administrator" role that is guaranteed to exist in the postgres database at the startup time of talawa api.
	 */
	API_ADMINISTRATOR_USER_PASSWORD: Type.String({
		minLength: 1,
	}),
	/**
	 * Base url that is exposed to the clients for making requests to the talawa api server at runtime.
	 */
	API_BASE_URL: Type.String({
		minLength: 1,
	}),
	/**
	 * URL to the facebook account of the community.
	 */
	API_COMMUNITY_FACEBOOK_URL: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * URL to the github account of the community.
	 */
	API_COMMUNITY_GITHUB_URL: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * URL to the instagram account of the community.
	 */
	API_COMMUNITY_INACTIVITY_TIMEOUT_DURATION: Type.Optional(
		Type.Integer({
			minimum: 1,
		}),
	),
	/**
	 * URL to the instagram account of the community.
	 */
	API_COMMUNITY_INSTAGRAM_URL: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * URL to the linkedin account of the community.
	 */
	API_COMMUNITY_LINKEDIN_URL: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * Name of the community.
	 */
	API_COMMUNITY_NAME: Type.String({
		minLength: 1,
	}),
	/**
	 * URL to the reddit account of the community.
	 */
	API_COMMUNITY_REDDIT_URL: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * URL to the slack account of the community.
	 */
	API_COMMUNITY_SLACK_URL: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * URL to the website of the community.
	 */
	API_COMMUNITY_WEBSITE_URL: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * URL to the x account of the community.
	 */
	API_COMMUNITY_X_URL: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * URL to the youtube account of the community.
	 */
	API_COMMUNITY_YOUTUBE_URL: Type.Optional(
		Type.String({
			minLength: 1,
		}),
	),
	/**
	 * Used for providing the host of the domain on which talawa api will run.
	 */
	API_HOST: Type.String({
		minLength: 1,
	}),
	/**
	 * Used for providing the decision for whether to apply the sql migrations generated by drizzle-kit to the postgres database at the startup of talawa api.
	 */
	API_IS_APPLY_DRIZZLE_MIGRATIONS: Type.Boolean(),
	/**
	 * Used for providing the decision for whether to enable graphiql web client. It is useful to enable the graphiql web client in development environments for easier graphql schema exploration.
	 */
	API_IS_GRAPHIQL: Type.Boolean(),
	/**
	 * Used for providing the decision for whether to enable pretty logging with pino.js logger. It is useful to enable prettier logging in development environments for easier developer log comprehension.
	 */
	API_IS_PINO_PRETTY: Type.Boolean(),
	/**
	 * Used for providing the number of milli-seconds for setting the expiry time of authentication json web tokens created by talawa api.
	 */
	API_JWT_EXPIRES_IN: Type.Number({
		minimum: 0,
	}),
	/**
	 * Used for providing the secret for signing and verifying authentication json web tokens created by talawa api.
	 */
	API_JWT_SECRET: Type.String({
		minLength: 64,
	}),
	/**
	 * Used for providing the log level for the logger used in talawa api.
	 *
	 * @privateRemarks
	 * Log levels should only be changed when the developers know what they're doing. Otherwise the default log level of `info` should be used.
	 */
	API_LOG_LEVEL: Type.Enum({
		debug: "debug",
		error: "error",
		fatal: "fatal",
		info: "info",
		trace: "trace",
		warn: "warn",
	}),
	/**
	 * More information can be found at: {@link https://github.com/minio/minio-js?tab=readme-ov-file#initialize-minio-client}
	 */
	MINIO_ROOT_USER: Type.Optional(Type.String({ minLength: 1 })),
	/**
	 * More information can be found at: {@link https://github.com/minio/minio-js?tab=readme-ov-file#initialize-minio-client}
	 */
	API_MINIO_ACCESS_KEY: Type.String(),
	/**
	 * More information can be found at: {@link https://github.com/minio/minio-js?tab=readme-ov-file#initialize-minio-client}
	 */
	API_MINIO_END_POINT: Type.String(),
	/**
	 * More information can be found at: {@link https://github.com/minio/minio-js?tab=readme-ov-file#initialize-minio-client}
	 */
	API_MINIO_PORT: Type.Number(),
	/**
	 * More information can be found at: {@link https://github.com/minio/minio-js?tab=readme-ov-file#initialize-minio-client}
	 */
	API_MINIO_SECRET_KEY: Type.String(),
	/**
	 * More information can be found at: {@link https://github.com/minio/minio-js?tab=readme-ov-file#initialize-minio-client}
	 */
	API_MINIO_USE_SSL: Type.Boolean(),
	/**
	 * Used for providing the port of the domain on which the server will run.
	 */
	API_PORT: Type.Number({
		maximum: 65535,
		minimum: 0,
	}),
	/**
	 * More information at this link: {@link https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-DBNAME}
	 */
	API_POSTGRES_DATABASE: Type.String({
		minLength: 1,
	}),
	/**
	 * More information at this link: {@link https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-HOST}
	 */
	API_POSTGRES_HOST: Type.String({
		minLength: 1,
	}),
	/**
	 * More information at this link: {@link https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-PASSWORD}
	 */
	API_POSTGRES_PASSWORD: Type.String({
		minLength: 1,
	}),
	/**
	 * More information at this link: {@link https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-PORT}
	 */
	API_POSTGRES_PORT: Type.Number({
		maximum: 65535,
		minimum: 0,
	}),
	/**
	 * More information at this link: {@link https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-SSLMODE}
	 */
	API_POSTGRES_SSL_MODE: Type.Union([
		Type.Enum({
			allow: "allow",
			prefer: "prefer",
			require: "require",
			verify_full: "verify-full",
		}),
		Type.Boolean(),
	]),
	/**
	 * More information at this link: {@link https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNECT-USER}
	 */
	API_POSTGRES_USER: Type.String(),
});

/**
 * Type of the object containing parsed configuration environment variables.
 */
export type EnvConfig = Static<typeof envConfigSchema>;

/**
 * The `@sinclair/typebox` package doesn't do format validation by itself and requires custom validators for it. The `ajv-formats` package provides this functionality and this object is used to provide the talawa api specific configuration for the `ajv` property accepted by `envSchema` to define those custom format validators.
 */
export const envSchemaAjv: EnvSchemaOpt["ajv"] = {
	customOptions: (ajvInstance) => {
		ajvFormats.default(ajvInstance, {
			formats: ["email", "uri"],
		});
		return ajvInstance;
	},
};
