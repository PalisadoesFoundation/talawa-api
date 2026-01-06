import { isDeepStrictEqual } from "node:util";
import { mercuriusClient } from "./graphql/types/client";
import { Query_signIn } from "./graphql/types/documentNodes";
import { server } from "./server";

/**
 * This function is used to narrow the type of a value passed to it to not be equal to `null` or `undefined`. More information can be found at the following links:
 *
 * {@link https://github.com/vitest-dev/vitest/issues/2883#issuecomment-2176048122}
 *
 * {@link https://github.com/vitest-dev/vitest/issues/5702#issuecomment-2176048295}
 *
 * @example
 *
 * const func = (name: string | null | undefined) => {
 * 	assertToBeNonNullish(name);
 * 	console.log(name.length);
 * }
 */
export function assertToBeNonNullish<T>(
	value: T | null | undefined,
	message?: string,
): asserts value is T {
	if (value === undefined || value === null) {
		const defaultMessage = `Expected value to be non-nullish but received: ${value}`;
		const error = new Error(message ?? defaultMessage);
		error.name = "AssertionError";
		throw error;
	}
}

/**
 * This function is useful for checking if the sequence passed to it as the first argument is a subsequence of the sequence passed to it as the second argument. A subsequence is a sequence that can be derived from another sequence by deleting some or no elements from the latter without changing the order of the remaining elements.
 *
 * @example
 * if(isSubsequence([3, 4, 1, 9, 2], [1, 2]){
 * 	console.log("[1, 2] is a subsequence of [3, 4, 1, 9, 2].")
 * }
 */
export const isSubSequence = <T>(sequence: T[], subsequence: T[]) => {
	let j = 0;
	// Iterate through the sequence to find the subsequence in order.
	for (let i = 0; i < sequence.length; i += 1) {
		if (isDeepStrictEqual(sequence[i], subsequence[j])) {
			j += 1;
		}
		// Return true if the matching for the entire subsequence has completed.
		if (j === subsequence.length) {
			return true;
		}
	}
	// Return true or false depending on whether the matching for the entire subsequence has completed along with the loop exit.
	return j === subsequence.length;
};

/**
 * Retrieves an administrative authentication token for testing purposes.
 * This helper function performs a sign-in operation using the administrator
 * credentials configured in the server environment and asserts that a valid
 * token is returned.
 *
 * @returns {Promise<string>} A promise that resolves to the admin authentication token.
 * @throws {AssertionError} If the sign-in fails or no token is returned.
 */
export async function getAdminAuthToken(): Promise<string> {
	const signInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});
	const adminToken = signInResult.data?.signIn?.authenticationToken ?? null;
	assertToBeNonNullish(adminToken);
	return adminToken;
}
