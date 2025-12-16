import { faker } from "@faker-js/faker";
import type { ResultOf, VariablesOf } from "gql.tada";
import { assertToBeNonNullish } from "test/helpers";
import { afterEach, expect, suite, test, vi } from "vitest";
import type {
	ForbiddenActionExtensions,
	ForbiddenActionOnArgumentsAssociatedResourcesExtensions,
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
} from "~/src/utilities/TalawaGraphQLError";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_deleteOrganization,
	Mutation_signUp,
	Query_signIn,
} from "../documentNodes";

/**
 * Helper function to get admin auth token with proper error handling
 * @throws {Error} If admin credentials are invalid or missing
 * @returns {Promise<string>} Admin authentication token
 */
let cachedAdminToken: string | null = null;
let cachedAdminId: string | null = null;
async function getAdminAuthTokenAndId(): Promise<{
	cachedAdminToken: string;
	cachedAdminId: string;
}> {
	if (cachedAdminToken && cachedAdminId) {
		return { cachedAdminToken, cachedAdminId };
	}

	try {
		// Check if admin credentials exist
		if (
			!server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS ||
			!server.envConfig.API_ADMINISTRATOR_USER_PASSWORD
		) {
			throw new Error(
				"Admin credentials are missing in environment configuration",
			);
		}
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		// Check for GraphQL errors
		if (adminSignInResult.errors) {
			throw new Error(
				`Admin authentication failed: ${
					adminSignInResult.errors[0]?.message || "Unknown error"
				}`,
			);
		}
		// Check for missing data
		if (!adminSignInResult.data?.signIn?.authenticationToken) {
			throw new Error(
				"Admin authentication succeeded but no token was returned",
			);
		}
		if (!adminSignInResult.data?.signIn?.user?.id) {
			throw new Error(
				"Admin authentication succeeded but no user id was returned",
			);
		}
		const token = adminSignInResult.data.signIn.authenticationToken;
		const id = adminSignInResult.data.signIn.user.id;
		cachedAdminToken = token;
		cachedAdminId = id;
		return { cachedAdminToken: token, cachedAdminId: id };
	} catch (error) {
		// Wrap and rethrow with more context
		throw new Error(
			`Failed to get admin authentication token: ${
				error instanceof Error ? error.message : "Unknown error"
			}`,
		);
	}
}

// Helper Types
interface TestOrganization {
	orgId: string;
	cleanup: () => Promise<void>;
}

async function createTestOrganization(
	userRegistrationRequired = false,
): Promise<TestOrganization> {
	const { cachedAdminToken: adminAuthToken } = await getAdminAuthTokenAndId();

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
					isUserRegistrationRequired: userRegistrationRequired,
				},
			},
		},
	);

	// Check for errors before asserting
	if (!createOrgResult.data || !createOrgResult.data.createOrganization) {
		throw new Error(
			`Failed to create test organization: ${
				createOrgResult.errors?.[0]?.message || "Unknown error"
			}`,
		);
	}

	assertToBeNonNullish(createOrgResult.data);
	assertToBeNonNullish(createOrgResult.data.createOrganization);
	const orgId = createOrgResult.data.createOrganization.id;

	return {
		orgId,
		cleanup: async () => {
			const errors: Error[] = [];
			try {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${adminAuthToken}` },
					variables: { input: { id: orgId } },
				});
			} catch (error) {
				errors.push(error as Error);
				console.error("Failed to delete organization:", error);
			}
			if (errors.length > 0) {
				throw new AggregateError(errors, "One or more cleanup steps failed");
			}
		},
	};
}

suite("Mutation field signUp", () => {
	suite(
		`results in a graphql error with "forbidden_action" extensions code in the "errors" field and "null" as the value of "data.signUp" field if`,
		() => {
			test("client triggering the graphql operation is already signed in.", async () => {
				const administratorUserSignInResult = await mercuriusClient.query(
					Query_signIn,
					{
						variables: {
							input: {
								emailAddress:
									server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
								password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
							},
						},
					},
				);

				assertToBeNonNullish(
					administratorUserSignInResult.data.signIn?.authenticationToken,
				);

				const signUpResult = await mercuriusClient.mutate(Mutation_signUp, {
					headers: {
						authorization: `bearer ${administratorUserSignInResult.data.signIn.authenticationToken}`,
					},
					variables: {
						input: {
							emailAddress: `emailAddress${faker.string.ulid()}@email.com`,
							name: "name",
							password: "password",
							selectedOrganization: "3891785a-1760-48a2-8d72-f5632ad1371b",
						},
					},
				});

				expect(signUpResult.data.signUp).toEqual(null);
				expect(signUpResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<ForbiddenActionExtensions>({
								code: "forbidden_action",
							}),
							message: expect.any(String),
							path: ["signUp"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "invalid_arguments" extensions code in the "errors" field and "null" as the value of "data.signUp" field if`,
		() => {
			test(`length of the value of the argument "input.addressLine1" is less than 1.
				length of the value of the argument "input.addressLine2" is less than 1.
				length of the value of the argument "input.city" is less than 1.
				length of the value of the argument "input.description" is less than 1.
				length of the value of the argument "input.name" is less than 1.
				length of the value of the argument "input.password" is less than 1.
				length of the value of the argument "input.postalCode" is less than 1.
				length of the value of the argument "input.state" is less than 1.`, async () => {
				const signUpResult = await mercuriusClient.mutate(Mutation_signUp, {
					variables: {
						input: {
							addressLine1: "",
							addressLine2: "",
							city: "",
							description: "",
							emailAddress: `emailAddress${faker.string.ulid()}@email.com`,
							name: "",
							password: "",
							postalCode: "",
							state: "",
							selectedOrganization: "",
						},
					},
				});

				expect(signUpResult.data.signUp).toEqual(null);
				expect(signUpResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining<
									InvalidArgumentsExtensions["issues"][number]
								>([
									{
										argumentPath: ["input", "addressLine1"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "addressLine2"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "city"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "description"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "name"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "password"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "postalCode"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "state"],
										message: expect.any(String),
									},
								]),
							}),
							message: expect.any(String),
							path: ["signUp"],
						}),
					]),
				);
			});

			test(`length of the value of the argument "input.addressLine1" is more than 1025.length of the value of the argument "input.addressLine2" is more than 1025.
				length of the value of the argument "input.city" is more than 64.
				length of the value of the argument "input.description" is more than 2048.
				length of the value of the argument "input.name" is more than 256.
				length of the value of the argument "input.password" is more than 64.
				length of the value of the argument "input.postalCode" is more than 32.
				length of the value of the argument "input.state" is more than 64.`, async () => {
				const signUpResult = await mercuriusClient.mutate(Mutation_signUp, {
					variables: {
						input: {
							addressLine1: `addressLine1${faker.string.alpha(1025)}`,
							addressLine2: `addressLine2${faker.string.alpha(1025)}`,
							city: `city${faker.string.alpha(65)}`,
							description: `description${faker.string.alpha(2049)}`,
							emailAddress: `emailAddress${faker.string.ulid()}@email.com`,
							name: `name${faker.string.alpha(257)}`,
							password: `password${faker.string.alpha(65)}`,
							postalCode: `postalCode${faker.string.alpha(33)}`,
							state: `state${faker.string.alpha(65)}`,
							selectedOrganization: "3891785a-1760-48a2-8d72-f5632ad1371b",
						},
					},
				});

				expect(signUpResult.data.signUp).toEqual(null);
				expect(signUpResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining<
									InvalidArgumentsExtensions["issues"][number]
								>([
									{
										argumentPath: ["input", "addressLine1"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "addressLine2"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "city"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "description"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "name"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "password"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "postalCode"],
										message: expect.any(String),
									},
									{
										argumentPath: ["input", "state"],
										message: expect.any(String),
									},
								]),
							}),
							message: expect.any(String),
							path: ["signUp"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "forbidden_action_on_arguments_associated_resources" extensions code in the "errors" field and "null" as the value of "data.signUp" field if`,
		() => {
			test('value of the argument "input.emailAddress" corresponds to an existing user.', async () => {
				const signUpResult = await mercuriusClient.mutate(Mutation_signUp, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							name: "name",
							password: "password",
							selectedOrganization: "3891785a-1760-48a2-8d72-f5632ad1371b",
						},
					},
				});

				expect(signUpResult.data.signUp).toEqual(null);
				expect(signUpResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions:
								expect.objectContaining<ForbiddenActionOnArgumentsAssociatedResourcesExtensions>(
									{
										code: "forbidden_action_on_arguments_associated_resources",
										issues: expect.arrayContaining<
											ForbiddenActionOnArgumentsAssociatedResourcesExtensions["issues"][number]
										>([
											{
												argumentPath: ["input", "emailAddress"],
												message: expect.any(String),
											},
										]),
									},
								),
							message: expect.any(String),
							path: ["signUp"],
						}),
					]),
				);
			});

			test('value of the argument "input.selectedOrganization" does not belongs to existing organization', async () => {
				const signUpResult = await mercuriusClient.mutate(Mutation_signUp, {
					variables: {
						input: {
							emailAddress: `email${faker.string.ulid()}@email.com`,
							name: "name",
							password: "password",
							selectedOrganization: "3891785a-1760-48a2-8d72-f5632ad1371b",
						},
					},
				});

				expect(signUpResult.data.signUp).toEqual(null);
				expect(signUpResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions:
								expect.objectContaining<ForbiddenActionOnArgumentsAssociatedResourcesExtensions>(
									{
										code: "forbidden_action_on_arguments_associated_resources",
										issues: expect.arrayContaining<
											ForbiddenActionOnArgumentsAssociatedResourcesExtensions["issues"][number]
										>([
											{
												argumentPath: ["input", "selectedOrganization"],
												message: expect.any(String),
											},
										]),
									},
								),
							message: expect.any(String),
							path: ["signUp"],
						}),
					]),
				);
			});
		},
	);

	suite(
		'results in "undefined" as the value of "errors" field and the expected value for the "data.signUp" field where',
		() => {
			const testCleanupFunctions: Array<() => Promise<void>> = [];

			afterEach(async () => {
				for (const cleanup of testCleanupFunctions.reverse()) {
					try {
						await cleanup();
					} catch (error) {
						console.error("Cleanup failed:", error);
					}
				}
				// Reset the cleanup functions array
				testCleanupFunctions.length = 0;
			});

			test(`nullable user fields have the values of the corresponding nullable arguments.
				non-nullable user fields with no corresponding arguments have the default values.
				non-nullable user fields have the values of the corresponding non-nullable arguments.`, async () => {
				// Create a test organization
				const organization = await createTestOrganization();
				testCleanupFunctions.push(organization.cleanup);

				const variables: VariablesOf<typeof Mutation_signUp> = {
					input: {
						addressLine1: "addressLine1",
						addressLine2: "addressLine2",
						birthDate: "1901-01-01",
						city: "city",
						countryCode: "us",
						description: "description",
						educationGrade: "kg",
						emailAddress: `email${faker.string.ulid()}@email.com`,
						employmentStatus: "part_time",
						homePhoneNumber: "+11111111",
						maritalStatus: "widowed",
						mobilePhoneNumber: "+11111111",
						name: "name",
						password: "password",
						natalSex: "female",
						postalCode: "postalCode",
						state: "state",
						workPhoneNumber: "+11111111",
						selectedOrganization: organization.orgId,
					},
				};

				const signUpResult = await mercuriusClient.mutate(Mutation_signUp, {
					variables,
				});

				expect(signUpResult.errors).toBeUndefined();
				expect(signUpResult.data.signUp).toEqual(
					expect.objectContaining<ResultOf<typeof Mutation_signUp>["signUp"]>({
						authenticationToken: expect.any(String),
						refreshToken: expect.any(String),
						user: expect.objectContaining<
							Partial<
								NonNullable<ResultOf<typeof Mutation_signUp>["signUp"]>["user"]
							>
						>({
							addressLine1: variables.input.addressLine1,
							addressLine2: variables.input.addressLine2,
							birthDate: variables.input.birthDate,
							city: variables.input.city,
							countryCode: variables.input.countryCode,
							createdAt: expect.any(String),
							description: variables.input.description,
							educationGrade: variables.input.educationGrade,
							emailAddress: variables.input.emailAddress,
							employmentStatus: variables.input.employmentStatus,
							homePhoneNumber: variables.input.homePhoneNumber,
							id: expect.any(String),
							isEmailAddressVerified: false,
							maritalStatus: variables.input.maritalStatus,
							mobilePhoneNumber: variables.input.mobilePhoneNumber,
							name: variables.input.name,
							natalSex: variables.input.natalSex,
							postalCode: variables.input.postalCode,
							role: "regular",
							state: variables.input.state,
							workPhoneNumber: variables.input.workPhoneNumber,
						}),
					}),
				);
			});

			test('nullable user fields have the "null" values if the corresponding nullable arguments are not provided in the graphql operation.', async () => {
				// Create a test organization
				const organization = await createTestOrganization();
				testCleanupFunctions.push(organization.cleanup);

				const variables: VariablesOf<typeof Mutation_signUp> = {
					input: {
						emailAddress: `emailAddress${faker.string.ulid()}@email.com`,
						name: "name",
						password: "password",
						selectedOrganization: organization.orgId,
					},
				};

				const signUpResult = await mercuriusClient.mutate(Mutation_signUp, {
					variables,
				});

				expect(signUpResult.errors).toBeUndefined();
				expect(signUpResult.data.signUp).toEqual(
					expect.objectContaining<ResultOf<typeof Mutation_signUp>["signUp"]>({
						authenticationToken: expect.any(String),
						refreshToken: expect.any(String),
						user: expect.objectContaining<
							Partial<
								NonNullable<ResultOf<typeof Mutation_signUp>["signUp"]>["user"]
							>
						>({
							addressLine1: null,
							addressLine2: null,
							birthDate: null,
							city: null,
							countryCode: null,
							description: null,
							educationGrade: null,
							employmentStatus: null,
							homePhoneNumber: null,
							maritalStatus: null,
							mobilePhoneNumber: null,
							natalSex: null,
							postalCode: null,
							state: null,
							workPhoneNumber: null,
						}),
					}),
				);
			});

			test("New membership request should be created if isUserRegistrationRequired=true in Organization", async () => {
				// Create a test organization
				const organization = await createTestOrganization(true);
				testCleanupFunctions.push(organization.cleanup);

				const variables: VariablesOf<typeof Mutation_signUp> = {
					input: {
						emailAddress: `emailAddress${faker.string.ulid()}@email.com`,
						name: "name",
						password: "password",
						selectedOrganization: organization.orgId,
					},
				};

				const signUpResult = await mercuriusClient.mutate(Mutation_signUp, {
					variables,
				});

				expect(signUpResult.errors).toBeUndefined();
				expect(signUpResult.data.signUp).toEqual(
					expect.objectContaining<ResultOf<typeof Mutation_signUp>["signUp"]>({
						authenticationToken: expect.any(String),
						refreshToken: expect.any(String),
						user: expect.objectContaining<
							Partial<
								NonNullable<ResultOf<typeof Mutation_signUp>["signUp"]>["user"]
							>
						>({
							addressLine1: null,
							addressLine2: null,
							birthDate: null,
							city: null,
							countryCode: null,
							description: null,
							educationGrade: null,
							employmentStatus: null,
							homePhoneNumber: null,
							maritalStatus: null,
							mobilePhoneNumber: null,
							natalSex: null,
							postalCode: null,
							state: null,
							workPhoneNumber: null,
						}),
					}),
				);
			});
		},
	);

	suite(
		'results in a graphql error with "unexpected" extensions code in the "errors" field if',
		() => {
			const testCleanupFunctions: Array<() => Promise<void>> = [];

			afterEach(async () => {
				for (const cleanup of testCleanupFunctions.reverse()) {
					try {
						await cleanup();
					} catch (error) {
						console.error("Cleanup failed:", error);
					}
				}
				// Reset the cleanup functions array
				testCleanupFunctions.length = 0;
			});

			test("the database fails to return the created user after the insert operation", async () => {
				// Create a test organization
				const organization = await createTestOrganization();
				testCleanupFunctions.push(organization.cleanup);
				// Mock the database transaction to simulate the failure
				const originalTransaction = server.drizzleClient.transaction;

				server.drizzleClient.transaction = vi
					.fn()
					.mockImplementation(async (fn) => {
						const fakeTx = {
							insert: () => ({
								values: () => ({
									returning: async () => [],
								}),
							}),
						};
						return await fn(fakeTx);
					});

				const variables: VariablesOf<typeof Mutation_signUp> = {
					input: {
						emailAddress: `email${faker.string.ulid()}@email.com`,
						name: "Test User",
						password: "password",
						selectedOrganization: organization.orgId,
					},
				};

				try {
					const signUpResult = await mercuriusClient.mutate(Mutation_signUp, {
						variables,
					});

					// Assertions
					expect(signUpResult.data.signUp).toBeNull();
					expect(signUpResult.errors).toEqual(
						expect.arrayContaining<TalawaGraphQLFormattedError>([
							expect.objectContaining<TalawaGraphQLFormattedError>({
								extensions: expect.objectContaining({
									code: "unexpected",
								}),
								message: expect.any(String),
							}),
						]),
					);
				} finally {
					// Restore the original implementation
					server.drizzleClient.transaction = originalTransaction;
				}
			});

			test("the created organization membership is undefined", async () => {
				// Create a test organization
				const organization = await createTestOrganization();
				testCleanupFunctions.push(organization.cleanup);

				// Mock the database transaction to simulate the condition
				const originalTransaction = server.drizzleClient.transaction;

				server.drizzleClient.transaction = vi
					.fn()
					.mockImplementation(async (fn) => {
						let insertCallCount = 0;

						const fakeTx = {
							insert: vi.fn().mockImplementation(() => {
								insertCallCount++;

								if (insertCallCount === 1) {
									// First insert operation (normal behavior)
									return {
										values: () => ({
											returning: async () => [{ id: 1, name: "OrgMember" }],
										}),
									};
								}
								// Second insert operation (returns undefined)
								return {
									values: () => ({
										returning: async () => [],
									}),
								};
							}),
						};
						return await fn(fakeTx);
					});

				const variables: VariablesOf<typeof Mutation_signUp> = {
					input: {
						emailAddress: `email${faker.string.ulid()}@email.com`,
						name: "Test User",
						password: "password",
						selectedOrganization: organization.orgId,
					},
				};

				try {
					const signUpResult = await mercuriusClient.mutate(Mutation_signUp, {
						variables,
					});

					// Assertions
					expect(signUpResult.data.signUp).toBeNull();
					expect(signUpResult.errors).toEqual(
						expect.arrayContaining<TalawaGraphQLFormattedError>([
							expect.objectContaining<TalawaGraphQLFormattedError>({
								extensions: expect.objectContaining({
									code: "unexpected",
								}),
								message: expect.any(String),
							}),
						]),
					);
				} finally {
					// Restore the original implementation
					server.drizzleClient.transaction = originalTransaction;
				}
			});

			test("the created membership request is undefined", async () => {
				// Create a test organization
				const organization = await createTestOrganization(true);
				testCleanupFunctions.push(organization.cleanup);

				// Mock the database transaction to simulate the condition
				const originalTransaction = server.drizzleClient.transaction;

				server.drizzleClient.transaction = vi
					.fn()
					.mockImplementation(async (fn) => {
						let insertCallCount = 0;

						const fakeTx = {
							insert: vi.fn().mockImplementation(() => {
								insertCallCount++;

								if (insertCallCount === 1) {
									// First insert operation (normal behavior)
									return {
										values: () => ({
											returning: async () => [{ id: 1, name: "OrgMember" }],
										}),
									};
								}
								// Second insert operation (returns undefined)
								return {
									values: () => ({
										returning: async () => [],
									}),
								};
							}),
						};
						return await fn(fakeTx);
					});

				const variables: VariablesOf<typeof Mutation_signUp> = {
					input: {
						emailAddress: `email${faker.string.ulid()}@email.com`,
						name: "Test User",
						password: "password",
						selectedOrganization: organization.orgId,
					},
				};

				try {
					const signUpResult = await mercuriusClient.mutate(Mutation_signUp, {
						variables,
					});

					// Assertions
					expect(signUpResult.data.signUp).toBeNull();
					expect(signUpResult.errors).toEqual(
						expect.arrayContaining<TalawaGraphQLFormattedError>([
							expect.objectContaining<TalawaGraphQLFormattedError>({
								extensions: expect.objectContaining({
									code: "unexpected",
								}),
								message: expect.any(String),
							}),
						]),
					);
				} finally {
					// Restore the original implementation
					server.drizzleClient.transaction = originalTransaction;
				}
			});
		},
	);
});
