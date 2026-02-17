import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";

/**
 * Minimal server shape required for REST admin sign-in.
 * Tests pass the same server instance from test/server.ts.
 */
interface ServerWithAuthEnv {
	envConfig: {
		API_ADMINISTRATOR_USER_EMAIL_ADDRESS: string;
		API_ADMINISTRATOR_USER_PASSWORD: string;
	};
	inject(opts: {
		method: string;
		payload: { email: string; password: string };
		url: string;
	}): Promise<{
		body: string;
		cookies: Array<{ name: string; value: string }>;
		statusCode: number;
	}>;
}

export interface AdminAuthRestResult {
	accessToken: string;
	cookies: Array<{ name: string; value: string }>;
}

/**
 * Obtains admin authentication via REST POST /auth/signin for use in tests.
 * Returns the access token (for `Authorization: Bearer <token>`) and the
 * response cookies (for `server.inject(..., { cookies: ... })`).
 *
 * Use this helper in tests that need admin auth. It will replace GraphQL
 * Query_signIn usage when PR 4b migrates tests to REST auth.
 */
export async function getAdminAuthViaRest(
	server: ServerWithAuthEnv,
): Promise<AdminAuthRestResult> {
	const response = await server.inject({
		method: "POST",
		url: "/auth/signin",
		payload: {
			email: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	});

	if (response.statusCode !== 200) {
		throw new Error(
			`REST admin sign-in failed: ${response.statusCode} ${response.body}`,
		);
	}

	const accessCookie = response.cookies.find(
		(c) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
	);
	if (!accessCookie?.value) {
		throw new Error("REST admin sign-in did not set access token cookie");
	}

	return {
		accessToken: accessCookie.value,
		cookies: [...response.cookies],
	};
}
