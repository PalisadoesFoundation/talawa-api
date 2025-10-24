import { faker } from "@faker-js/faker";
import { afterEach, expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_deleteCurrentUser,
	Mutation_deleteOrganization,
	Mutation_deleteUser,
	Mutation_updateOrganization,
} from "../documentNodes";

const signInResult = await mercuriusClient.query(
	`query Query_signIn($input: QuerySignInInput!) {
		signIn(input: $input) {
			authenticationToken
		}
	}`,
	{
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	},
);
assertToBeNonNullish(signInResult.data?.signIn);
const authToken = signInResult.data.signIn.authenticationToken;
assertToBeNonNullish(authToken);

suite("Mutation field updateOrganization", () => {
	const testCleanupFunctions: Array<() => Promise<void>> = [];

	afterEach(async () => {
		let firstError: unknown;
		while (testCleanupFunctions.length > 0) {
			const cleanup = testCleanupFunctions.pop();
			if (!cleanup) {
				continue;
			}

			try {
				await cleanup();
			} catch (error) {
				console.error("Cleanup failed:", error);
				firstError ??= error;
			}
		}

		if (firstError !== undefined) {
			throw firstError;
		}
	});

	test("should return an error with unauthenticated extensions code when no auth token provided", async () => {
		const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
			variables: {
				input: {
					id: faker.string.uuid(),
					name: "Updated Organization Name",
				},
			},
		});

		expect(result.data?.updateOrganization).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
					path: ["updateOrganization"],
				}),
			]),
		);
	});

	test("should return an error with unauthorized_action extensions code", async () => {
		const { authToken: regularAuthToken, userId: regularUserId } =
			await createRegularUserUsingAdmin();
		assertToBeNonNullish(regularAuthToken);
		assertToBeNonNullish(regularUserId);

		// Add cleanup for the regular user
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: regularUserId } },
			});
		});

		// Create an organization as admin first
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Test Org for Regular User",
						description: "Organization for unauthorized update test",
						countryCode: "us",
						state: "CA",
						city: "San Francisco",
						postalCode: "94101",
						addressLine1: "123 Test St",
						addressLine2: "Suite 100",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Add cleanup for the organization
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: orgId } },
			});
		});

		// Try to update as regular user
		const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
			headers: { authorization: `bearer ${regularAuthToken}` },
			variables: {
				input: {
					id: orgId,
					name: "Updated by Regular User",
				},
			},
		});

		expect(result.data?.updateOrganization).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthorized_action",
					}),
					path: ["updateOrganization"],
				}),
			]),
		);
	});

	test("should return an error with unauthenticated extensions code when user is deleted", async () => {
		const { authToken: userToken } = await createRegularUserUsingAdmin();
		assertToBeNonNullish(userToken);

		// Delete the user
		await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
			headers: { authorization: `bearer ${userToken}` },
		});

		// Create an organization as admin first
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Test Org for Deleted User",
						description: "Organization for deleted user test",
						countryCode: "us",
						state: "CA",
						city: "San Francisco",
						postalCode: "94101",
						addressLine1: "123 Main St",
						addressLine2: "Suite 100",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Add cleanup for the organization
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: orgId } },
			});
		});

		// Try to update with deleted user's token
		const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
			headers: { authorization: `bearer ${userToken}` },
			variables: {
				input: {
					id: orgId,
					name: "Updated by Deleted User",
				},
			},
		});

		expect(result.data?.updateOrganization).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
					path: ["updateOrganization"],
				}),
			]),
		);
	});

	test("should return an error when no update fields are provided", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Test Org for Empty Update",
						description: "Organization for empty update test",
						countryCode: "us",
						state: "CA",
						city: "San Francisco",
						postalCode: "94101",
						addressLine1: "123 Empty St",
						addressLine2: "Suite 100",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Add cleanup for the organization
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: orgId } },
			});
		});

		const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: orgId,
				},
			},
		});

		expect(result.data?.updateOrganization).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
					}),
					path: ["updateOrganization"],
				}),
			]),
		);
	});

	test("should update basic organization fields", async () => {
		// Create an organization first
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Original Organization Name",
						description: "Original description",
						countryCode: "us",
						state: "CA",
						city: "San Francisco",
						postalCode: "94101",
						addressLine1: "123 Original St",
						addressLine2: "Suite 100",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Add cleanup for the organization
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: orgId } },
			});
		});

		// Update the organization
		const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: orgId,
					name: "Updated Organization Name",
					description: "Updated description",
					addressLine1: "456 Updated Ave",
					city: "Los Angeles",
					state: "CA",
					postalCode: "90210",
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateOrganization).toEqual(
			expect.objectContaining({
				id: orgId,
				name: "Updated Organization Name",
				description: "Updated description",
				addressLine1: "456 Updated Ave",
				city: "Los Angeles",
				state: "CA",
				postalCode: "90210",
				countryCode: "us",
			}),
		);
	});

	test("should update isUserRegistrationRequired field", async () => {
		// Create an organization first
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Registration Test Org",
						description: "Organization for registration test",
						countryCode: "us",
						state: "NY",
						city: "New York",
						postalCode: "10001",
						addressLine1: "123 Registration St",
						addressLine2: "Suite 200",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Add cleanup for the organization
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: orgId } },
			});
		});

		// Update isUserRegistrationRequired to true
		const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: orgId,
					isUserRegistrationRequired: true,
				},
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateOrganization).toEqual(
			expect.objectContaining({
				id: orgId,
				isUserRegistrationRequired: true,
			}),
		);
	});
	test("should toggle isUserRegistrationRequired from true to false", async () => {
		// Create organization
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Toggle Test Org",
						description: "Organization for toggle test",
						countryCode: "us",
						state: "NY",
						city: "New York",
						postalCode: "10001",
						addressLine1: "123 Toggle St",
						addressLine2: "Suite 300",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Add cleanup for the organization
		testCleanupFunctions.push(async () => {
			await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { id: orgId } },
			});
		});

		// Set to true
		const setTrueResult = await mercuriusClient.mutate(
			Mutation_updateOrganization,
			{
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: { id: orgId, isUserRegistrationRequired: true },
				},
			},
		);
		expect(setTrueResult.errors).toBeUndefined();
		expect(setTrueResult.data?.updateOrganization).toEqual(
			expect.objectContaining({
				id: orgId,
				isUserRegistrationRequired: true,
			}),
		);
		// Toggle back to false
		const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: { id: orgId, isUserRegistrationRequired: false },
			},
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.updateOrganization).toEqual(
			expect.objectContaining({
				id: orgId,
				isUserRegistrationRequired: false,
			}),
		);
	});
	test("should return an error when organization does not exist", async () => {
		const result = await mercuriusClient.mutate(Mutation_updateOrganization, {
			headers: { authorization: `bearer ${authToken}` },
			variables: {
				input: {
					id: faker.string.uuid(), // non-existent ID
					name: "Updated Name",
				},
			},
		});

		expect(result.data?.updateOrganization).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: expect.stringMatching(/not_found|invalid_arguments/),
					}),
					path: ["updateOrganization"],
				}),
			]),
		);
	});
});
