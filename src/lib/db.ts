import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
dotenv.config();

const DATABASE_URL = `postgres://${process.env.API_POSTGRES_USER}:${process.env.API_POSTGRES_PASSWORD}@${process.env.API_POSTGRES_HOST}:${process.env.API_POSTGRES_PORT}/${process.env.API_POSTGRES_DATABASE}`;

let client: postgres.Sql;

try {
	client = postgres(DATABASE_URL, {
		prepare: false,
		max: 10, //Connection pooling
		idle_timeout: 30, //auto-close idle connections
		ssl: process.env.API_POSTGRES_SSL_MODE === "true" ? "allow" : undefined,
		...(process.env.NODE_ENV === "development" && {
			debug: (connection, query, params) => {
				console.log("Running SQL Query:", query);
				console.log("Query Parameters:", params);
			},
		}),
	});

	console.log("✅ Database connected successfully");
} catch (error) {
	console.error("❌ Failed to connect to the database:", error);
	process.exit(1);
}

// ✅ Connect Drizzle ORM
export const db = drizzle(client);

// ✅ Graceful Shutdown Handler
const shutdownHandler = async () => {
	console.log("Closing database connections...");
	try {
		await client.end();
		console.log("Database connections closed.");
	} catch (error) {
		console.error("❌ Error closing database connections:", error);
	}
	process.exit(0);
};

// ✅ Listen for termination signals
process.on("SIGINT", shutdownHandler);
process.on("SIGTERM", shutdownHandler);
