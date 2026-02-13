import { describe, expect, it } from "vitest";
import {
	assertSecretsPresent,
	type EnvConfig,
	StartupConfigError,
} from "~/src/createServer";

const makeValidEnvConfig = (): EnvConfig =>
	({
		API_JWT_SECRET:
			"aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		API_COOKIE_SECRET: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
		API_MINIO_SECRET_KEY: "minio-secret-key",
		API_POSTGRES_PASSWORD: "postgres-app-password",
		API_ADMINISTRATOR_USER_PASSWORD: "admin-password",
	}) as unknown as EnvConfig;

describe("assertSecretsPresent", () => {
	it("throws StartupConfigError when an API secret is empty", () => {
		const envConfig = makeValidEnvConfig();
		envConfig.API_POSTGRES_PASSWORD =
			"" as unknown as EnvConfig["API_POSTGRES_PASSWORD"];

		expect(() => assertSecretsPresent(envConfig)).toThrow(StartupConfigError);
	});

	it("throws StartupConfigError when an API secret contains the sentinel", () => {
		const envConfig = makeValidEnvConfig();
		envConfig.API_MINIO_SECRET_KEY =
			"CHANGE_ME_BEFORE_DEPLOY" as unknown as EnvConfig["API_MINIO_SECRET_KEY"];

		expect(() => assertSecretsPresent(envConfig)).toThrow(StartupConfigError);
	});

	it("throws StartupConfigError when MINIO_ROOT_PASSWORD contains the sentinel", () => {
		const envConfig = makeValidEnvConfig();
		const prev = process.env.MINIO_ROOT_PASSWORD;
		try {
			process.env.MINIO_ROOT_PASSWORD = "CHANGE_ME_BEFORE_DEPLOY";
			expect(() => assertSecretsPresent(envConfig)).toThrow(StartupConfigError);
		} finally {
			if (prev === undefined) {
				delete process.env.MINIO_ROOT_PASSWORD;
			} else {
				process.env.MINIO_ROOT_PASSWORD = prev;
			}
		}
	});

	it("throws StartupConfigError when POSTGRES_PASSWORD contains the sentinel", () => {
		const envConfig = makeValidEnvConfig();
		const prev = process.env.POSTGRES_PASSWORD;
		try {
			process.env.POSTGRES_PASSWORD = "CHANGE_ME_BEFORE_DEPLOY";
			expect(() => assertSecretsPresent(envConfig)).toThrow(StartupConfigError);
		} finally {
			if (prev === undefined) {
				delete process.env.POSTGRES_PASSWORD;
			} else {
				process.env.POSTGRES_PASSWORD = prev;
			}
		}
	});

	it("does not throw when values are non-empty and do not contain sentinel (and service vars are unset)", () => {
		const envConfig = makeValidEnvConfig();

		const prevMinio = process.env.MINIO_ROOT_PASSWORD;
		const prevPostgres = process.env.POSTGRES_PASSWORD;
		try {
			delete process.env.MINIO_ROOT_PASSWORD;
			delete process.env.POSTGRES_PASSWORD;
			expect(() => assertSecretsPresent(envConfig)).not.toThrow();
		} finally {
			if (prevMinio === undefined) {
				delete process.env.MINIO_ROOT_PASSWORD;
			} else {
				process.env.MINIO_ROOT_PASSWORD = prevMinio;
			}
			if (prevPostgres === undefined) {
				delete process.env.POSTGRES_PASSWORD;
			} else {
				process.env.POSTGRES_PASSWORD = prevPostgres;
			}
		}
	});
});
