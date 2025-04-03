import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import dotenv from "dotenv";
import { eq } from "drizzle-orm";
import {
  accountTable,
  sessionTable,
  usersTable,
  verificationTable,
} from "../drizzle/schema";
import { db } from "./db";
dotenv.config();

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
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
    freshAge: 60 * 5, // 5 minutes (the session is fresh if created within the last 5 minutes)

    //cookieCache is similar to refreshToken
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // Cache duration in seconds
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      try {
        const { path } = ctx;
        const newSession = ctx.context.newSession;

        if (newSession) {
          const user = newSession.user;
          const session = newSession.session;

          if (path.startsWith("/sign-up")) {
            return ctx.json({
              statusCode: "10000",
              message: "Success",
              data: {
                token: session.token,
                id: user.id,
              },
            });
          }

          if (path.startsWith("/sign-in")) {
            const userDetailsResult = await db
              .select({
                role: usersTable.role,
                countryCode: usersTable.countryCode,
                avatarName: usersTable.avatarName,
              })
              .from(usersTable)
              .where(eq(usersTable.id, user.id));

            const userDetails = userDetailsResult[0];

            return ctx.json({
              statusCode: "10000",
              message: "Success",
              data: {
                token: session.token,
                id: user.id,
                email: user.email,
                name: user.name,
                role: userDetails?.role,
                countryCode: userDetails?.countryCode,
                avatarName: userDetails?.avatarName,
              },
            });
          }
        }

        // If no session is available, return an error
        return ctx.json({
          statusCode: "10001",
          message: "No active session",
        });
      } catch (error: unknown) {
        console.error(
          "authentication error:",
          error instanceof Error ? error.message : "Unknown error",
          {
            path: ctx.path,
            error: error instanceof Error ? error.stack : String(error),
          }
        );

        return ctx.json({
          statusCode: "10001",
          message: "Failure",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }),
  },

  trustedOrigins: [process.env.API_CORS_ORIGIN || "http://localhost:4321"],
});
