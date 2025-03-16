import { faker } from "@faker-js/faker";
import { assertToBeNonNullish } from "../../helpers";
import { server } from "../../server";
import { mercuriusClient } from "./client";
import { Mutation_createUser, Query_signIn } from "./documentNodes";

export async function createRegularUserUsingAdmin(): Promise<{
	userId: string;
	authToken: string;
}> {
	const adminSignInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});
	assertToBeNonNullish(adminSignInResult.data.signIn?.authenticationToken);
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
	assertToBeNonNullish(createUserResult.data.createUser?.authenticationToken);
	assertToBeNonNullish(createUserResult.data.createUser?.user?.id);

	return {
		userId: createUserResult.data.createUser.user.id,
		authToken: createUserResult.data.createUser.authenticationToken,
	};
}
