import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { envConfig } from "drizzle.config";
import postgres from "postgres";
import * as schema from "../../schema";

// credentials
const db_name = envConfig.API_POSTGRES_DATABASE;
const host = envConfig.API_POSTGRES_HOST;
const password = envConfig.API_POSTGRES_PASSWORD;
const port = envConfig.API_POSTGRES_PORT;
const username = envConfig.API_POSTGRES_USER;

// forming connection string
const db_url = `postgresql://${username}:${password}@${host}:${port}/${db_name}`;

const client = postgres(db_url);

// logger: true enables logs in terminal.
// {schema} introduces types of all the tables

export const db = drizzle(client, { schema, logger: true });
