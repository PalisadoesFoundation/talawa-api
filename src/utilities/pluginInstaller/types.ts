import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { FastifyBaseLogger } from "fastify";
import type { FileUpload } from "graphql-upload-minimal";
import type * as drizzleSchema from "~/src/drizzle/schema";
import type { IPluginManifest } from "~/src/plugin/types";

type DrizzleClientInterface = PostgresJsDatabase<typeof drizzleSchema>;

export interface PluginInstallationOptions {
	zipFile: FileUpload;
	drizzleClient: DrizzleClientInterface;
	activate?: boolean;
	userId: string;
	logger?: FastifyBaseLogger;
}

export interface PluginZipStructure {
	hasApiFolder: boolean;
	apiManifest?: IPluginManifest;
	pluginId?: string;
}
