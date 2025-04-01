import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
dotenv.config();
const DATABASE_URL = `postgres://${process.env.API_POSTGRES_USER}:${process.env.API_POSTGRES_PASSWORD}@${process.env.API_POSTGRES_HOST}:${process.env.API_POSTGRES_PORT}/${process.env.API_POSTGRES_DATABASE}`;
const client = postgres(DATABASE_URL, {
	prepare: false,
	// Enable debug mode in development
	...(process.env.NODE_ENV === "development" && {
		debug: (connection, query, params) => {
			console.log("Running SQL Query:", query);
			console.log("📌 Query Parameters:", params);
		},
	}),
});
// Connect Drizzle ORM
export const db = drizzle(client);

// Handle application shutdown
const shutdownHandler = async () => {
	console.log("Closing database connections...");
	await client.end();
	console.log("Database connections closed.");
	process.exit(0);
};

// Listen for termination signals
process.on("SIGINT", shutdownHandler);
process.on("SIGTERM", shutdownHandler);
