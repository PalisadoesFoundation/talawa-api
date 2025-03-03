import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import {
	accountTable,
	sessionTable,
	usersTable,
	verificationTable,
} from "../drizzle/schema";
import { db } from "./db";

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
	emailAndPassword: {
		enabled: true,
	},
	trustedOrigins: ["http://localhost:4321"],
});
