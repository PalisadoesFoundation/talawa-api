import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { fundsTableInsertSchema } from "~/src/drizzle/tables/funds";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionOnArgumentsAssociatedResourcesExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createFund,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Query_fund,
	Query_signIn,
} from "../documentNodes";

// Helper function to get admin auth token
async function getAdminAuthToken(): Promise<string> {
	const adminSignInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});

	assertToBeNonNullish(adminSignInResult.data.signIn?.authenticationToken);
	return adminSignInResult.data.signIn.authenticationToken;
}

suite("Query field fund", () => {
	suite("results in a graphql error", () => {
		test("with 'unauthenticated' extensions code if client is not authenticated", async () => {
			const fundResult = await mercuriusClient.query(Query_fund, {
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			});

			expect(fundResult.data.fund).toEqual(null);
			expect(fundResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["fund"],
					}),
				]),
			);
		});

		test("with 'arguments_associated_resources_not_found' extensions code if fund not found", async () => {
			const adminSignInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});

			assertToBeNonNullish(adminSignInResult.data.signIn?.authenticationToken);

			const fundResult = await mercuriusClient.query(Query_fund, {
				headers: {
					authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			});

			expect(fundResult.data.fund).toEqual(null);
			expect(fundResult.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions:
							expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
								{
									code: "arguments_associated_resources_not_found",
									issues: [
										{
											argumentPath: ["input", "id"],
										},
									],
								},
							),
						message: expect.any(String),
						path: ["fund"],
					}),
				]),
			);
		});

		test("returns fund data if user is organization member", async () => {
			const regularUserResult = await createRegularUser();
			const { fundId, orgId } = await createFund();

			await addUserToOrg(regularUserResult.userId, orgId);

			const fundResult = await mercuriusClient.query(Query_fund, {
				headers: {
					authorization: `bearer ${regularUserResult.authToken}`,
				},
				variables: {
					input: {
						id: fundId,
					},
				},
			});

			expect(fundResult.errors).toBeUndefined();
			expect(fundResult.data.fund).toEqual(
				expect.objectContaining({
					id: fundId,
					isTaxDeductible: expect.any(Boolean),
					name: expect.any(String),
				}),
			);
		});
	});

	// Test helper functions
	async function createRegularUser() {
		const adminAuthToken = await getAdminAuthToken();

		// Create regular user as admin
		const userResult = await mercuriusClient.mutate(Mutation_createUser, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					emailAddress: `email${faker.string.uuid()}@test.com`,
					password: "password123",
					role: "regular",
					name: "Test User",
					isEmailAddressVerified: false,
				},
			},
		});

		assertToBeNonNullish(userResult.data?.createUser?.authenticationToken);
		assertToBeNonNullish(userResult.data?.createUser?.user?.id);

		return {
			authToken: userResult.data.createUser.authenticationToken,
			userId: userResult.data.createUser.user.id,
		};
	}

	async function createFund() {
		const adminAuthToken = await getAdminAuthToken();

		// Create organization
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						name: `Org ${faker.string.uuid()}`,
						countryCode: "us",
					},
				},
			},
		);

		assertToBeNonNullish(createOrgResult.data?.createOrganization?.id);
		const orgId = createOrgResult.data.createOrganization.id;

		// Create fund
		const createFundResult = await mercuriusClient.mutate(Mutation_createFund, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					name: `Fund ${faker.string.uuid()}`,
					organizationId: orgId,
					isTaxDeductible: false,
				},
			},
		});

		assertToBeNonNullish(createFundResult.data?.createFund?.id);

		return {
			fundId: createFundResult.data.createFund.id,
			orgId,
		};
	}

	async function addUserToOrg(userId: string, orgId: string) {
		const adminAuthToken = await getAdminAuthToken();

		await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					memberId: userId,
					organizationId: orgId,
					role: "regular",
				},
			},
		});
	}

	test("with 'unauthorized_action_on_arguments_associated_resources' if non-admin user is not a member of fund's organization", async () => {
		const regularUserResult = await createRegularUser();
		const { fundId } = await createFund();

		const fundResult = await mercuriusClient.query(Query_fund, {
			headers: {
				authorization: `bearer ${regularUserResult.authToken}`,
			},
			variables: {
				input: {
					id: fundId,
				},
			},
		});

		expect(fundResult.data.fund).toEqual(null);
		expect(fundResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions:
						expect.objectContaining<UnauthorizedActionOnArgumentsAssociatedResourcesExtensions>(
							{
								code: "unauthorized_action_on_arguments_associated_resources",
								issues: [
									{
										argumentPath: ["input", "id"],
									},
								],
							},
						),
					message: expect.any(String),
					path: ["fund"],
				}),
			]),
		);
	});
});

test("returns fund data if user is an admin", async () => {
	const adminSignInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});

	assertToBeNonNullish(adminSignInResult.data.signIn?.authenticationToken);

	const { fundId } = await createFund();

	const fundResult = await mercuriusClient.query(Query_fund, {
		headers: {
			authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
		},
		variables: {
			input: {
				id: fundId,
			},
		},
	});

	expect(fundResult.errors).toBeUndefined();
	expect(fundResult.data.fund).toEqual(
		expect.objectContaining({
			id: fundId,
			isTaxDeductible: expect.any(Boolean),
			name: expect.any(String),
		}),
	);
});

test("returns fund data if user is organization member", async () => {
	const regularUserResult = await createRegularUser();
	const { fundId, orgId } = await createFund();

	await addUserToOrg(regularUserResult.userId, orgId);

	const fundResult = await mercuriusClient.query(Query_fund, {
		headers: {
			authorization: `bearer ${regularUserResult.authToken}`,
		},
		variables: {
			input: {
				id: fundId,
			},
		},
	});

	expect(fundResult.errors).toBeUndefined();
	expect(fundResult.data.fund).toEqual(
		expect.objectContaining({
			id: fundId,
			isTaxDeductible: expect.any(Boolean),
			name: expect.any(String),
		}),
	);
});

suite("Funds schema validation and field behavior", () => {
	test("validates fund name constraints", () => {
		// Test length constraints
		const tooShortName = "";
		const tooLongName = "a".repeat(257);
		const validName = "Test Fund";

		// Test special cases
		const specialCharsName = "Fund #1 @Special!";
		const whitespaceOnlyName = "   ";
		const unicodeName = "Fund 🚀 测试";
		const spacePaddedName = "  Test Fund  ";

		// Test length constraints
		const tooShortResult = fundsTableInsertSchema.safeParse({
			name: tooShortName,
			isTaxDeductible: false,
			organizationId: faker.string.uuid(),
		});
		expect(tooShortResult.success).toBe(false);

		const tooLongResult = fundsTableInsertSchema.safeParse({
			name: tooLongName,
			isTaxDeductible: false,
			organizationId: faker.string.uuid(),
		});
		expect(tooLongResult.success).toBe(false);

		const validResult = fundsTableInsertSchema.safeParse({
			name: validName,
			isTaxDeductible: false,
			organizationId: faker.string.uuid(),
		});
		expect(validResult.success).toBe(true);

		// Test special characters
		const specialCharsResult = fundsTableInsertSchema.safeParse({
			name: specialCharsName,
			isTaxDeductible: false,
			organizationId: faker.string.uuid(),
		});
		expect(specialCharsResult.success).toBe(true);

		// Test whitespace-only name
		const whitespaceOnlyResult = fundsTableInsertSchema.safeParse({
			name: whitespaceOnlyName,
			isTaxDeductible: false,
			organizationId: faker.string.uuid(),
		});
		expect(whitespaceOnlyResult.success).toBe(true);

		// Test unicode characters
		const unicodeResult = fundsTableInsertSchema.safeParse({
			name: unicodeName,
			isTaxDeductible: false,
			organizationId: faker.string.uuid(),
		});
		expect(unicodeResult.success).toBe(true);

		// Test space-padded name
		const spacePaddedResult = fundsTableInsertSchema.safeParse({
			name: spacePaddedName,
			isTaxDeductible: false,
			organizationId: faker.string.uuid(),
		});
		expect(spacePaddedResult.success).toBe(true);
	});

	test("verifies unique constraint on fund name within organization", async () => {
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		assertToBeNonNullish(adminSignInResult.data.signIn?.authenticationToken);

		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: {
					authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
				},
				variables: {
					input: {
						name: `Org ${faker.string.uuid()}`,
						countryCode: "us",
					},
				},
			},
		);

		assertToBeNonNullish(createOrgResult.data?.createOrganization?.id);
		const orgId = createOrgResult.data.createOrganization.id;
		const fundName = `Test Fund ${faker.string.uuid()}`;

		const fund1Result = await mercuriusClient.mutate(Mutation_createFund, {
			headers: {
				authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
			},
			variables: {
				input: {
					name: fundName,
					organizationId: orgId,
					isTaxDeductible: false,
				},
			},
		});

		assertToBeNonNullish(fund1Result.data?.createFund?.id);

		const fund2Result = await mercuriusClient.mutate(Mutation_createFund, {
			headers: {
				authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
			},
			variables: {
				input: {
					name: fundName,
					organizationId: orgId,
					isTaxDeductible: true,
				},
			},
		});

		expect(fund2Result.errors).toBeDefined();
		expect(fund2Result.errors?.[0]?.extensions?.code).toBe(
			"forbidden_action_on_arguments_associated_resources",
		);
	});

	test("verifies UUID generation for fund id", async () => {
		const { fundId } = await createFund();
		expect(fundId).toMatch(
			/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
		);
	});
});

test("validates required fund fields", () => {
	const validInput = {
		name: "Test Fund",
		isTaxDeductible: false,
		organizationId: faker.string.uuid(),
	};

	// Test missing name
	const missingName = { ...validInput, name: undefined };
	expect(fundsTableInsertSchema.safeParse(missingName).success).toBe(false);

	// Test missing isTaxDeductible
	const missingTaxStatus = { ...validInput, isTaxDeductible: undefined };
	expect(fundsTableInsertSchema.safeParse(missingTaxStatus).success).toBe(
		false,
	);

	// Test missing organizationId
	const missingOrgId = { ...validInput, organizationId: undefined };
	expect(fundsTableInsertSchema.safeParse(missingOrgId).success).toBe(false);

	// Valid data should pass
	expect(fundsTableInsertSchema.safeParse(validInput).success).toBe(true);
});

test("validates fund field constraints", () => {
	const validInput = {
		name: "Test Fund",
		isTaxDeductible: false,
		organizationId: faker.string.uuid(),
	};

	// Test name constraints
	expect(
		fundsTableInsertSchema.safeParse({
			...validInput,
			name: "",
		}).success,
	).toBe(false);

	expect(
		fundsTableInsertSchema.safeParse({
			...validInput,
			name: "a".repeat(257),
		}).success,
	).toBe(false);

	// Test isTaxDeductible must be boolean
	expect(
		fundsTableInsertSchema.safeParse({
			...validInput,
			isTaxDeductible: "true",
		}).success,
	).toBe(false);

	// Test organizationId must be UUID
	expect(
		fundsTableInsertSchema.safeParse({
			...validInput,
			organizationId: "invalid-uuid",
		}).success,
	).toBe(false);
});

// Test helper functions
async function createRegularUser() {
	// First sign in as admin
	const adminSignInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});

	assertToBeNonNullish(adminSignInResult.data.signIn?.authenticationToken);

	// Create regular user as admin
	const userResult = await mercuriusClient.mutate(Mutation_createUser, {
		headers: {
			authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
		},
		variables: {
			input: {
				emailAddress: `email${faker.string.uuid()}@test.com`,
				password: "password123",
				role: "regular",
				name: "Test User",
				isEmailAddressVerified: false,
			},
		},
	});

	assertToBeNonNullish(userResult.data?.createUser?.authenticationToken);
	assertToBeNonNullish(userResult.data?.createUser?.user?.id);

	return {
		authToken: userResult.data.createUser.authenticationToken,
		userId: userResult.data.createUser.user.id,
	};
}

async function createFund() {
	// First sign in as admin to create org and fund
	const adminSignInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});

	assertToBeNonNullish(adminSignInResult.data.signIn?.authenticationToken);

	// Create organization
	const createOrgResult = await mercuriusClient.mutate(
		Mutation_createOrganization,
		{
			headers: {
				authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
			},
			variables: {
				input: {
					name: `Org ${faker.string.uuid()}`,
					countryCode: "us",
				},
			},
		},
	);

	assertToBeNonNullish(createOrgResult.data?.createOrganization?.id);
	const orgId = createOrgResult.data.createOrganization.id;

	// Create fund
	const createFundResult = await mercuriusClient.mutate(Mutation_createFund, {
		headers: {
			authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
		},
		variables: {
			input: {
				name: `Fund ${faker.string.uuid()}`,
				organizationId: orgId,
				isTaxDeductible: false,
			},
		},
	});

	assertToBeNonNullish(createFundResult.data?.createFund?.id);

	return {
		fundId: createFundResult.data.createFund.id,
		orgId,
	};
}

async function addUserToOrg(userId: string, orgId: string) {
	const adminSignInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});

	assertToBeNonNullish(adminSignInResult.data.signIn?.authenticationToken);

	await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
		headers: {
			authorization: `bearer ${adminSignInResult.data.signIn.authenticationToken}`,
		},
		variables: {
			input: {
				memberId: userId,
				organizationId: orgId,
				role: "regular",
			},
		},
	});
}
