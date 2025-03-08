# Better Auth Integration with Fastify and GraphQL

## Overview
This document explains how **Better Auth** integrates with **Fastify** and **GraphQL** for authentication. It provides details on environment setup, database schema, middleware configuration, and how requests are handled.

---

## 1. Setting Up Environment Variables
Make sure you have the required environment variables in your `.env` file. The `BETTER_AUTH_SECRET` must be set, and its value can be generated from [this link](https://better-auth.vercel.app/docs/installation).

### Required Environment Variables:
```env
BETTER_AUTH_SECRET=<your_generated_secret>
API_POSTGRES_USER=<your_db_user>
API_POSTGRES_PASSWORD=<your_db_password>
API_POSTGRES_HOST=<your_db_host>
API_POSTGRES_PORT=<your_db_port>
API_POSTGRES_DATABASE=<your_db_name>
```

---

## 2. Connecting to PostgreSQL with Drizzle ORM

We use **Drizzle ORM** to connect to the PostgreSQL database. The connection URL is dynamically constructed from environment variables.

```typescript
import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

dotenv.config();

const DATABASE_URL = `postgres://${process.env.API_POSTGRES_USER}:${process.env.API_POSTGRES_PASSWORD}@${process.env.API_POSTGRES_HOST}:${process.env.API_POSTGRES_PORT}/${process.env.API_POSTGRES_DATABASE}`;

const client = postgres(DATABASE_URL, {
	prepare: false,
	// debug: (connection, query, params) => {
	// 	console.log("Running SQL Query:", query);
	// 	console.log("📌 Query Parameters:", params);
	// },
});

// Connect Drizzle ORM
export const db = drizzle(client);
```

### Notes:
- **Ensure `.env` variables are properly set** before running the application.
- If you want to **debug SQL queries**, uncomment the `console.log` lines in the `debug` option.

---

## 3. Database Schema & Migrations
The required database tables for **Better Auth** are already created, and migration files are present. 

### Important Migrations:
1. **Main Migration**: `20250122092015_sweet_scrambler.sql`
2. **Better Auth Migration**: `20250303173255_cheerful_deadpool.sql`

### To Apply Migrations:
Run the following command to ensure all database changes are applied:
```sh
npm run apply_drizzle_migrations
```
✅ If you have already migrated the **main migration file**, you only need to migrate `20250303173255_cheerful_deadpool.sql`. There is no need to manually create tables.

---

## 4. Authentication Middleware
To integrate **Better Auth** with Fastify, we redirect all `/api/auth/*` requests to `auth.ts`, where authentication logic is handled.

### Updated `createServer` Code:
```typescript
fastify.all("/api/auth/*", async (req, reply) => {
	console.log(`✅ Route hit: ${req.method} ${req.url}`);

	const headers: Record<string, string> = {};
	for (const [key, value] of Object.entries(req.headers)) {
		if (value) {
			headers[key] = Array.isArray(value) ? value.join(", ") : value;
		}
	}

	const fetchRequest = new Request(
		`${req.protocol}://${req.hostname}${req.url}`,
		{
			method: req.method,
			headers,
			body:
				req.method !== "GET" && req.method !== "HEAD"
					? JSON.stringify(req.body)
					: undefined,
		}
	);

	// Handle authentication
	const response = await auth.handler(fetchRequest);

	// Send response back to Fastify
	reply.status(response.status);
	response.headers.forEach((value, key) => reply.header(key, value));
	reply.send(await response.text());
});
```

- This ensures that all authentication-related requests are handled by **Better Auth** before reaching GraphQL.
- It converts Fastify requests into **Fetch API** requests, making them compatible with **Better Auth** handlers.

---

## 5. CORS Configuration
To prevent **CORS errors**, we enable **CORS support** for both **GraphQL and Better Auth** using `fastify-cors`:

```typescript
fastify.register(fastifyCors, {
	origin: "http://localhost:4321", // Allow only your frontend origin
	credentials: true, // Allow sending cookies and authentication headers
	methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed methods
	allowedHeaders: [
		"Content-Type",
		"Authorization",
		"apollo-require-preflight",
	],
});
```

- **Origin restriction:** Allows requests only from `http://localhost:4321`.
- **Credentials enabled:** Ensures authentication headers and cookies are passed.
- **Allowed methods:** `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`.

---

## 6. Better Auth Configuration (`auth.ts`)
The authentication logic is defined inside `/src/lib/auth.ts`. Below is a summary of how **Better Auth** is configured:

```typescript
export const auth = betterAuth({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: {
			user: usersTable,
			account: accountTable,
			session: sessionTable,
			verification: verificationTable,
		},
	}),
	advanced: {
		generateId: false,
	},
	user: {
		modelName: "user",
		fields: {
			email: "emailAddress",
			emailVerified: "isEmailAddressVerified",
		},
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 7 days
		updateAge: 60 * 60 * 24, // 1 day
		freshAge: 60 * 5, // 5 minutes
		cookieCache: {
			enabled: true,
			maxAge: 5 * 60,
		},
	},
	emailAndPassword: {
		enabled: true,
	},
	trustedOrigins: ["http://localhost:4321"],
});
```

### Key Features:
- Uses **Drizzle ORM** as a database adapter.
- Supports **email and password authentication**.
- Implements **session management** with refresh-like cookie caching.
- Allows **role-based access** and **trusted origins**.

---

## Conclusion
You have successfully integrated **Better Auth** with Fastify and GraphQL. Ensure the **environment variables**, **migrations**, and **CORS settings** are properly configured. 🚀

