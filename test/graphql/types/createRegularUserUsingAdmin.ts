import { faker } from "@faker-js/faker";
import { assertToBeNonNullish } from "../../helpers";
import { server } from "../../server";
import { mercuriusClient } from "./client";
import { Mutation_createUser, Query_signIn } from "./documentNodes";

export async function createRegularUserUsingAdmin(): Promise<{
	userId: string;
	authToken: string;
}> {
	// Clear any existing headers to ensure a clean sign-in
	mercuriusClient.setHeaders({});

	const adminSignInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});

	// Check for errors first
	if (adminSignInResult.errors) {
		throw new Error(
			`Admin sign-in failed: ${JSON.stringify(adminSignInResult.errors)}`,
		);
	}

	assertToBeNonNullish(adminSignInResult.data?.signIn);
	assertToBeNonNullish(adminSignInResult.data.signIn.authenticationToken);
	const adminAuthToken = adminSignInResult.data.signIn.authenticationToken;

	// Use the admin token to create a regular user
	const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
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
	});

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
