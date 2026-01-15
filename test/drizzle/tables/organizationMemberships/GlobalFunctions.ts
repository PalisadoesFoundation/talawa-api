import { mercuriusClient } from "test/graphql/types/client";
import {
	Mutation_createOrganization,
	Query_signIn,
} from "test/graphql/types/documentNodes";
import { assertToBeNonNullish } from "test/helpers";
import { server } from "test/server";

export async function createTestOrganization(): Promise<string> {
	// Clear any existing headers to ensure a clean sign-in
	mercuriusClient.setHeaders({});
	const signIn = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});
	if (signIn.errors) {
		throw new Error(`Admin sign-in failed: ${JSON.stringify(signIn.errors)}`);
	}
	const token = signIn.data?.signIn?.authenticationToken;
	assertToBeNonNullish(
		token,
		"Authentication token is missing from sign-in response",
	);
	const org = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${token}` },
		variables: {
			input: {
				name: `Org-${Date.now()}`,
				countryCode: "us",
				isUserRegistrationRequired: true,
			},
		},
	});
	if (org.errors) {
		throw new Error(
			`Create organization failed: ${JSON.stringify(org.errors)}`,
		);
	}
	const orgId = org.data?.createOrganization?.id;
	assertToBeNonNullish(
		orgId,
		"Organization ID is missing from creation response",
	);
	return orgId;
}

export async function loginAdminUser(): Promise<{
	adminId: string;
	authToken: string;
}> {
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
	assertToBeNonNullish(adminSignInResult.data.signIn.user);

	return {
		adminId: adminSignInResult.data.signIn.user.id,
		authToken: adminSignInResult.data.signIn.authenticationToken,
	};
}
