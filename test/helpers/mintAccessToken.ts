import { signAccessToken } from "~/src/services/auth/tokens";
import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";

/**
 * Mints a valid access token for the given user using the same signing config
 * as the app's token service. This bypasses POST /auth/signin to avoid
 * rate limits during tests.
 *
 * @param _server - Unused; kept for API consistency with callers that pass the server.
 * @param user - Object with id and email (e.g. from getOrCreateAdminUserId).
 * @returns Promise resolving to { token, cookieName } for use in Authorization header or cookies.
 */
export async function mintAccessTokenForUser(
	_server: unknown,
	user: { id: string; email: string },
): Promise<{ token: string; cookieName: string }> {
	const token = await signAccessToken(user);
	return {
		token,
		cookieName: COOKIE_NAMES.ACCESS_TOKEN,
	};
}
