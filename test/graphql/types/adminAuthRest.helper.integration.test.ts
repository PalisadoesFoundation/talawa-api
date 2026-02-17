/**
 * Integration test for REST admin-auth helper.
 * Uses shared server (test/server.ts) per project convention for test/graphql/types/.
 * Cleans up the refresh token created by getAdminAuthViaRest in afterEach.
 */
import { afterEach, beforeEach, expect, suite, test } from "vitest";
import { revokeRefreshToken } from "~/src/services/auth";
import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";
import { getAdminAuthViaRest } from "../../helpers/adminAuthRest";
import { server } from "../../server";

suite("getAdminAuthViaRest helper", () => {
	/** Refresh token from the last getAdminAuthViaRest call in this suite; revoked in afterEach. */
	let lastRefreshToken: string | undefined;

	beforeEach(() => {
		// No setup required: uses existing admin credentials from server.envConfig.
	});

	afterEach(async () => {
		if (lastRefreshToken) {
			await revokeRefreshToken(server.drizzleClient, lastRefreshToken);
			lastRefreshToken = undefined;
		}
	});

	test("returns access token and cookies for valid admin credentials", async () => {
		const result = await getAdminAuthViaRest(server);
		lastRefreshToken = result.refreshToken;

		expect(result.accessToken).toBeDefined();
		expect(typeof result.accessToken).toBe("string");
		expect(result.accessToken.length).toBeGreaterThan(0);

		expect(result.cookies).toBeDefined();
		expect(Array.isArray(result.cookies)).toBe(true);
		const accessCookie = result.cookies.find(
			(c) => c.name === COOKIE_NAMES.ACCESS_TOKEN,
		);
		expect(accessCookie).toBeDefined();
		expect(accessCookie?.value).toBe(result.accessToken);
	});
});
