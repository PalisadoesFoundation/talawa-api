import { faker } from "@faker-js/faker";
import { assertToBeNonNullish } from "../../helpers";
import { getAdminAuthViaRest } from "../../helpers/adminAuthRest";
import { server } from "../../server";
import { mercuriusClient } from "./client";
import { Mutation_createUser } from "./documentNodes";

/**
 * GraphQL error structure with optional extensions
 */
interface GraphQLError {
	message?: string;
	extensions?: {
		code?: string;
	};
}

/**
 * Checks if an error indicates a rate limit condition
 */
function isRateLimitError(errors: unknown[] | undefined): boolean {
	if (!errors || !Array.isArray(errors)) {
		return false;
	}

	return errors.some((error) => {
		const graphqlError = error as GraphQLError;
		// Check structured error code in extensions
		if (graphqlError.extensions?.code === "too_many_requests") {
			return true;
		}
		// Fallback: check error message
		if (graphqlError.message?.toLowerCase().includes("too many requests")) {
			return true;
		}
		return false;
	});
}

/**
 * Retry function with exponential backoff for handling rate limits.
 * Handles rate limit errors returned in GraphQL response errors array.
 * Note: Thrown exceptions are NOT retried and will propagate immediately.
 *
 * @param fn - Async function to execute
 * @param retries - Number of retry attempts (default: 3)
 * @param delay - Initial delay in ms before retry (default: 1000)
 * @returns Promise resolving to the function result
 */
async function retryWithRateLimitCheck<T extends { errors?: unknown[] }>(
	fn: () => Promise<T>,
	retries = 3,
	delay = 1000,
): Promise<T> {
	const result = await fn();

	// Check if result contains rate limit error using structured detection
	if (isRateLimitError(result.errors) && retries > 0) {
		await new Promise((res) => setTimeout(res, delay));
		return retryWithRateLimitCheck(fn, retries - 1, delay * 2);
	}

	return result;
}

export async function createRegularUserUsingAdmin(): Promise<{
	userId: string;
	authToken: string;
}> {
	mercuriusClient.setHeaders({});

	const { accessToken: adminAuthToken } = await getAdminAuthViaRest(server);

	// Use the admin token to create a regular user with retry logic for rate limits
	const createUserResult = await retryWithRateLimitCheck(() =>
		mercuriusClient.mutate(Mutation_createUser, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					emailAddress: `email${faker.string.ulid()}@email.com`,
					isEmailAddressVerified: false,
					name: "Regular User",
					password: "password",
					role: "regular",
				},
			},
		}),
	);

	// Check for errors first
	if (createUserResult.errors) {
		throw new Error(
			`Create user failed: ${JSON.stringify(createUserResult.errors)}`,
		);
	}

	assertToBeNonNullish(createUserResult.data?.createUser);
	assertToBeNonNullish(createUserResult.data.createUser.authenticationToken);
	assertToBeNonNullish(createUserResult.data.createUser.user?.id);

	// Clear headers after use to prevent authentication state leakage
	mercuriusClient.setHeaders({});

	return {
		userId: createUserResult.data.createUser.user.id,
		authToken: createUserResult.data.createUser.authenticationToken,
	};
}
