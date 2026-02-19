import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";

/**
 * Cache of admin auth result per server instance so tests do not exceed the
 * auth rate limit (20 req/min). All tests share the same server; one sign-in
 * per run is enough.
 */
const adminAuthCache = new WeakMap<
	ServerWithAuthEnv,
	Promise<AdminAuthRestResult>
>();

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
	/** Raw refresh token value from the response cookie (for teardown/revoke). */
	refreshToken: string;
}

/**
 * Obtains admin authentication via REST POST /auth/signin for use in tests.
 * Returns the access token (for `Authorization: Bearer <token>`), the
 * response cookies (for `server.inject(..., { cookies: ... })`), and the
 * raw refresh token (for cleanup/revoke in afterEach/afterAll).
 *
 * Use this helper in tests that need admin auth. It will replace GraphQL
 * Query_signIn usage when PR 4b migrates tests to REST auth.
 *
 * @param server - Server instance with `envConfig` (admin email/password) and `inject` for HTTP. Typically the shared test server from test/server.ts.
 * @returns Promise resolving to an object with `accessToken` (string for "Authorization: Bearer &lt;token&gt;"), `cookies` (array usable in server.inject), and `refreshToken` (raw value for revoke/cleanup).
 */
export async function getAdminAuthViaRest(
	server: ServerWithAuthEnv,
): Promise<AdminAuthRestResult> {
	const cached = adminAuthCache.get(server);
	if (cached) return cached;

	const promise = (async (): Promise<AdminAuthRestResult> => {
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

		const refreshCookie = response.cookies.find(
			(c) => c.name === COOKIE_NAMES.REFRESH_TOKEN,
		);
		if (!refreshCookie?.value) {
			throw new Error("REST admin sign-in did not set refresh token cookie");
		}

		return {
			accessToken: accessCookie.value,
			cookies: [...response.cookies],
			refreshToken: refreshCookie.value,
		};
	})();

	adminAuthCache.set(server, promise);
	return promise;
}
