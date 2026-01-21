import { builder } from "~/src/graphql/builder";

/**
 * OAuth providers supported by the platform.
 */
export const OAuthProvider = builder.enumType("OAuthProvider", {
	description: "OAuth providers supported by the platform.",
	values: ["GOOGLE", "GITHUB"] as const,
});
