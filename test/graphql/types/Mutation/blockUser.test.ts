import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../../../routes/graphql/client";
import { createRegularUserUsingAdmin } from "../../../routes/graphql/createRegularUserUsingAdmin";
import {
	Mutation_blockUser,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Query_signIn,
} from "../../../routes/graphql/documentNodes";

const signInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});
assertToBeNonNullish(signInResult.data?.signIn);
const authToken = signInResult.data.signIn.authenticationToken;
assertToBeNonNullish(authToken);

suite("Mutation field blockUser", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_blockUser, {
				variables: {
					organizationId: faker.string.uuid(),
					userId: faker.string.uuid(),
				},
			});
			expect(result.data?.blockUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["blockUser"],
					}),
				]),
			);
		});
	});

	suite("when the organization does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: faker.string.uuid(),
					userId: faker.string.uuid(),
				},
			});
			expect(result.data?.blockUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["blockUser"],
					}),
				]),
			);
		});
	});

	suite("when the target user does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found extensions code", async () => {
			// Create an organization first
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Block User Test Org",
							description: "Org to test block user",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "100 Test St",
							addressLine2: "Suite 1",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const result = await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId: faker.string.uuid(),
				},
			});
			expect(result.data?.blockUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["blockUser"],
					}),
				]),
			);
		});
	});

	suite("when the current user is not an admin", () => {
		test("should return an error with unauthorized_action extensions code", async () => {
			// Create a regular user
			const { authToken: regularAuthToken, userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(regularAuthToken);
			assertToBeNonNullish(userId);

			// Create an organization
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Block User Auth Test Org",
							description: "Org to test block user auth",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "101 Test Ave",
							addressLine2: "Suite 2",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			// Add the regular user to the organization
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: userId,
					},
				},
			});

			// Create another user to block
			const { userId: targetUserId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(targetUserId);

			// Add the target user to the organization
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: targetUserId,
					},
				},
			});

			const result = await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${regularAuthToken}` },
				variables: {
					organizationId: orgId,
					userId: targetUserId,
				},
			});
			expect(result.data?.blockUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action",
						}),
						path: ["blockUser"],
					}),
				]),
			);
		});
	});

	suite("when the target user is already blocked", () => {
		test("should return an error with forbidden_action extensions code", async () => {
			// Create an organization
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Block User Test Org ${faker.string.uuid()}`,
							description: "Org to test block user",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "100 Test St",
							addressLine2: "Suite 1",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			// Get admin user ID
			assertToBeNonNullish(signInResult.data?.signIn);
			assertToBeNonNullish(signInResult.data.signIn.user);
			const adminId = signInResult.data.signIn.user.id;
			assertToBeNonNullish(adminId);

			// Add admin to the organization
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: adminId,
						role: "administrator",
					},
				},
			});

			// Create a regular user to block
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			// Add the user to the organization
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: userId,
					},
				},
			});

			// Block the user first
			await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId,
				},
			});

			// Try to block the same user again
			const result = await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId,
				},
			});
			expect(result.data?.blockUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "forbidden_action",
						}),
						path: ["blockUser"],
					}),
				]),
			);
		});
	});

	suite("when the target user is not a member", () => {
		test("should return an error with forbidden_action extensions code", async () => {
			// Create an organization
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Block User Test Org ${faker.string.uuid()}`,
							description: "Org to test block user",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "100 Test St",
							addressLine2: "Suite 1",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			// Get admin user ID
			assertToBeNonNullish(signInResult.data?.signIn);
			assertToBeNonNullish(signInResult.data.signIn.user);
			const adminId = signInResult.data.signIn.user.id;
			assertToBeNonNullish(adminId);

			// Add admin to the organization
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: adminId,
						role: "administrator",
					},
				},
			});

			// Create a regular user who is not a member
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			const result = await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId,
				},
			});
			expect(result.data?.blockUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "forbidden_action",
						}),
						path: ["blockUser"],
					}),
				]),
			);
		});
	});

	suite("when the current user tries to block themselves", () => {
		test("should return an error with forbidden_action extensions code", async () => {
			// Create an organization
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Block User Self Test Org ${faker.string.uuid()}`,
							description: "Org to test self block",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "102 Test Blvd",
							addressLine2: "Suite 3",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			// Get the current user's ID
			assertToBeNonNullish(signInResult.data?.signIn);
			assertToBeNonNullish(signInResult.data.signIn.user);
			const currentUserId = signInResult.data.signIn.user.id;
			assertToBeNonNullish(currentUserId);

			// Add the admin to the organization
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: currentUserId,
						role: "administrator",
					},
				},
			});

			// Try to block self
			const result = await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId: currentUserId,
				},
			});
			expect(result.data?.blockUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "forbidden_action",
						}),
						path: ["blockUser"],
					}),
				]),
			);
		});
	});

	suite("when the target user is an admin", () => {
		test("should return an error with forbidden_action extensions code", async () => {
			// Create an organization
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Block Admin Test Org ${faker.string.uuid()}`,
							description: "Org to test admin block",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "103 Test Circle",
							addressLine2: "Suite 4",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			// Create another admin user
			const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
				headers: {
					authorization: `bearer ${authToken}`,
				},
				variables: {
					input: {
						emailAddress: `email${faker.string.ulid()}@email.com`,
						isEmailAddressVerified: false,
						name: "Admin User",
						password: "password",
						role: "administrator",
					},
				},
			});
			assertToBeNonNullish(createUserResult.data?.createUser?.user?.id);
			const adminUserId = createUserResult.data.createUser.user.id;

			// Get current admin user ID
			assertToBeNonNullish(signInResult.data?.signIn);
			assertToBeNonNullish(signInResult.data.signIn.user);
			const currentAdminId = signInResult.data.signIn.user.id;
			assertToBeNonNullish(currentAdminId);

			// Add both admins to the organization
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: currentAdminId,
						role: "administrator",
					},
				},
			});

			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: adminUserId,
						role: "administrator",
					},
				},
			});

			// Try to block the admin
			const result = await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId: adminUserId,
				},
			});
			expect(result.data?.blockUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "forbidden_action",
						}),
						path: ["blockUser"],
					}),
				]),
			);
		});
	});

	suite("when all conditions are met", () => {
		test("should successfully block the user", async () => {
			// Create an organization
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Block User Success Test Org ${faker.string.uuid()}`,
							description: "Org to test successful block",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "104 Test Lane",
							addressLine2: "Suite 5",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			// Get admin user ID
			assertToBeNonNullish(signInResult.data?.signIn);
			assertToBeNonNullish(signInResult.data.signIn.user);
			const adminId = signInResult.data.signIn.user.id;
			assertToBeNonNullish(adminId);

			// Add admin to the organization
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: adminId,
						role: "administrator",
					},
				},
			});

			// Create a regular user to block
			const { userId } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId);

			// Add the user to the organization
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: userId,
					},
				},
			});

			// Block the user
			const result = await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId,
				},
			});
			expect(result.data?.blockUser).toBe(true);
			expect(result.errors).toBeUndefined();
		});
	});
});
