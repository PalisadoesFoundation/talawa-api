import { expect, test } from "vitest";
import { COOKIE_NAMES } from "~/src/utilities/cookieConfig";
import { getAdminAuthViaRest } from "../../helpers/adminAuthRest";
import { server } from "../../server";

test("getAdminAuthViaRest returns access token and cookies for valid admin credentials", async () => {
	const result = await getAdminAuthViaRest(server);

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
