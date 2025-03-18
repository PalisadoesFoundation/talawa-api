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
	Mutation_unblockUser,
	Query_organization,
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

suite("Organization.blockedUsers Field", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			// Create an organization first
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Blocked Users Test Org ${faker.string.uuid()}`,
							description: "Org to test blocked users",
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

			// Query without authentication
			const result = await mercuriusClient.query(Query_organization, {
				variables: {
					input: {
						id: orgId,
					},
					first: 10,
				},
			});

			expect(result.data?.organization?.blockedUsers).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["organization", "blockedUsers"],
					}),
				]),
			);
		});
	});

	suite("when there are no blocked users", () => {
		test("should return an empty connection", async () => {
			// Create an organization
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Empty Blocked Users Org ${faker.string.uuid()}`,
							description: "Org with no blocked users",
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

			// Query the organization's blocked users
			const result = await mercuriusClient.query(Query_organization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: orgId,
					},
					first: 10,
				},
			});

			expect(result.data?.organization?.blockedUsers?.edges).toHaveLength(0);
			expect(result.data?.organization?.blockedUsers?.pageInfo).toEqual({
				hasNextPage: false,
				hasPreviousPage: false,
				startCursor: null,
				endCursor: null,
			});
		});
	});

	suite("when there are blocked users", () => {
		test("should return the blocked users in the connection", async () => {
			// Create an organization
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Blocked Users Org ${faker.string.uuid()}`,
							description: "Org with blocked users",
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

			// Create users to block
			const { userId: userId1 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId1);
			const { userId: userId2 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId2);

			// Add users to the organization
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: userId1,
					},
				},
			});

			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: userId2,
					},
				},
			});

			// Block the users
			await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId: userId1,
				},
			});

			await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId: userId2,
				},
			});

			// Query the organization's blocked users
			const result = await mercuriusClient.query(Query_organization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: orgId,
					},
					first: 10,
				},
			});

			expect(result.data?.organization?.blockedUsers?.edges).toHaveLength(2);
			expect(result.data?.organization?.blockedUsers?.edges).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						node: expect.objectContaining({
							id: userId1,
						}),
					}),
					expect.objectContaining({
						node: expect.objectContaining({
							id: userId2,
						}),
					}),
				]),
			);
			expect(result.data?.organization?.blockedUsers?.pageInfo).toEqual({
				hasNextPage: false,
				hasPreviousPage: false,
				startCursor: expect.any(String),
				endCursor: expect.any(String),
			});
		});
	});

	suite("when pagination is used", () => {
		test("should respect the 'first' parameter", async () => {
			// Create an organization
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Pagination Org ${faker.string.uuid()}`,
							description: "Org for pagination testing",
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

			// Create users to block
			const { userId: userId1 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId1);
			const { userId: userId2 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId2);
			const { userId: userId3 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId3);

			// Add users to the organization
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: userId1,
					},
				},
			});

			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: userId2,
					},
				},
			});

			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: userId3,
					},
				},
			});

			// Block the users
			await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId: userId1,
				},
			});

			await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId: userId2,
				},
			});

			await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId: userId3,
				},
			});

			// Query with first=2
			const result = await mercuriusClient.query(Query_organization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: orgId,
					},
					first: 2,
				},
			});

			expect(result.data?.organization?.blockedUsers?.edges).toHaveLength(2);
			expect(result.data?.organization?.blockedUsers?.pageInfo.hasNextPage).toBe(true);
		});

		test("should handle cursor-based pagination", async () => {
			// Create an organization
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Cursor Pagination Org ${faker.string.uuid()}`,
							description: "Org for cursor pagination testing",
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

			// Create users to block
			const { userId: userId1 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId1);
			const { userId: userId2 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId2);
			const { userId: userId3 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId3);
			const { userId: userId4 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId4);

			// Add users to the organization
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: userId1,
					},
				},
			});

			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: userId2,
					},
				},
			});

			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: userId3,
					},
				},
			});

			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: userId4,
					},
				},
			});

			// Block the users
			await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId: userId1,
				},
			});

			await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId: userId2,
				},
			});

			await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId: userId3,
				},
			});

			await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId: userId4,
				},
			});

			// Query first page
			const firstPageResult = await mercuriusClient.query(Query_organization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: orgId,
					},
					first: 2,
				},
			});

			const blockedUsersEdges = firstPageResult.data?.organization?.blockedUsers?.edges;
			assertToBeNonNullish(blockedUsersEdges);
			expect(blockedUsersEdges).toHaveLength(2);
			expect(firstPageResult.data?.organization?.blockedUsers?.pageInfo.hasNextPage).toBe(true);
			const endCursor = firstPageResult.data?.organization?.blockedUsers?.pageInfo.endCursor;
			assertToBeNonNullish(endCursor);

			// Query second page
			const secondPageResult = await mercuriusClient.query(Query_organization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: orgId,
					},
					first: 2,
					after: endCursor,
				},
			});

			const secondPageEdges = secondPageResult.data?.organization?.blockedUsers?.edges;
			assertToBeNonNullish(secondPageEdges);
			expect(secondPageEdges).toHaveLength(2);
			expect(secondPageResult.data?.organization?.blockedUsers?.pageInfo.hasNextPage).toBe(false);
			expect(secondPageResult.data?.organization?.blockedUsers?.pageInfo.hasPreviousPage).toBe(true);
		});
	});

	suite("when a user is unblocked", () => {
		test("should no longer appear in the blocked users list", async () => {
			// Create an organization
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Unblock Test Org ${faker.string.uuid()}`,
							description: "Org for unblock testing",
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

			// Create users to block
			const { userId: userId1 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId1);
			const { userId: userId2 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId2);

			// Add users to the organization
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: userId1,
					},
				},
			});

			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: userId2,
					},
				},
			});

			// Block both users
			await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId: userId1,
				},
			});

			await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId: userId2,
				},
			});

			// Verify both users are blocked
			const beforeResult = await mercuriusClient.query(Query_organization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: orgId,
					},
					first: 10,
				},
			});

			const beforeEdges = beforeResult.data?.organization?.blockedUsers?.edges;
			assertToBeNonNullish(beforeEdges);
			expect(beforeEdges).toHaveLength(2);

			// Unblock one user
			await mercuriusClient.mutate(Mutation_unblockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId: userId1,
				},
			});

			// Verify only one user remains blocked
			const afterResult = await mercuriusClient.query(Query_organization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: orgId,
					},
					first: 10,
				},
			});

			const afterEdges = afterResult.data?.organization?.blockedUsers?.edges;
			assertToBeNonNullish(afterEdges);
			expect(afterEdges).toHaveLength(1);

			const node = afterEdges[0]?.node;
			assertToBeNonNullish(node);
			expect(node.id).toBe(userId2);
		});
	});
});
