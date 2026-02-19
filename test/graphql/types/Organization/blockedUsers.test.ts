import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import {
	Mutation_blockUser,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_unblockUser,
	Query_organization,
} from "../../../routes/graphql/documentNodes";
import { server } from "../../../server";
import { mercuriusClient } from "../../types/client";
import { createRegularUserUsingAdmin } from "../../types/createRegularUserUsingAdmin";
import { Query_currentUser } from "../documentNodes";

const { accessToken: authToken } = await getAdminAuthViaRest(server);
assertToBeNonNullish(authToken);
const currentUserResult = await mercuriusClient.query(Query_currentUser, {
	headers: { authorization: `bearer ${authToken}` },
});
const adminUserId = currentUserResult.data?.currentUser?.id;
assertToBeNonNullish(adminUserId);

suite("Organization.blockedUsers Field", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
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

			const adminId = adminUserId;
			assertToBeNonNullish(adminId);

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

			const result = await mercuriusClient.query(Query_organization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: orgId,
					},
					first: 10,
				},
			});

			const blockedUsers = result.data?.organization?.blockedUsers as {
				edges: Array<{ node: { id: string } }>;
				pageInfo: {
					hasNextPage: boolean;
					hasPreviousPage: boolean;
					startCursor: string | null;
					endCursor: string | null;
				};
			};
			assertToBeNonNullish(blockedUsers);

			expect(blockedUsers.edges).toHaveLength(0);
			expect(blockedUsers.pageInfo).toEqual({
				hasNextPage: false,
				hasPreviousPage: false,
				startCursor: null,
				endCursor: null,
			});
		});
	});

	suite("when there are blocked users", () => {
		test("should return the blocked users in the connection", async () => {
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

			const adminId = adminUserId;
			assertToBeNonNullish(adminId);

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

			const { userId: userId1 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId1);
			const { userId: userId2 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId2);

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

			const result = await mercuriusClient.query(Query_organization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: orgId,
					},
					first: 10,
				},
			});

			const blockedUsers = result.data?.organization?.blockedUsers as {
				edges: Array<{ node: { id: string } }>;
				pageInfo: {
					hasNextPage: boolean;
					hasPreviousPage: boolean;
					startCursor: string | null;
					endCursor: string | null;
				};
			};
			assertToBeNonNullish(blockedUsers);

			expect(blockedUsers.edges).toHaveLength(2);
			expect(blockedUsers.edges).toEqual(
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
			expect(blockedUsers.pageInfo).toEqual({
				hasNextPage: false,
				hasPreviousPage: false,
				startCursor: expect.any(String),
				endCursor: expect.any(String),
			});
		});
	});

	suite("when pagination is used", () => {
		test("should respect the 'first' parameter", async () => {
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

			const adminId = adminUserId;
			assertToBeNonNullish(adminId);

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

			const { userId: userId1 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId1);
			const { userId: userId2 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId2);
			const { userId: userId3 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId3);
			const { userId: userId4 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId4);

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

			const result = await mercuriusClient.query(Query_organization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: orgId,
					},
					first: 3,
				},
			});

			const blockedUsers = result.data?.organization?.blockedUsers as {
				edges: Array<{ node: { id: string } }>;
				pageInfo: {
					hasNextPage: boolean;
					hasPreviousPage: boolean;
					startCursor: string | null;
					endCursor: string | null;
				};
			};
			assertToBeNonNullish(blockedUsers);

			expect(blockedUsers.edges).toHaveLength(3);
			expect(blockedUsers.pageInfo.hasNextPage).toBe(true);
		});

		test("should handle cursor-based pagination", async () => {
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

			const adminId = adminUserId;
			assertToBeNonNullish(adminId);

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

			const { userId: userId1 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId1);
			const { userId: userId2 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId2);
			const { userId: userId3 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId3);
			const { userId: userId4 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId4);

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

			const result = await mercuriusClient.query(Query_organization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: orgId,
					},
					first: 3,
				},
			});

			const blockedUsers = result.data?.organization?.blockedUsers as {
				edges: Array<{ node: { id: string }; cursor: string }>;
				pageInfo: {
					hasNextPage: boolean;
					hasPreviousPage: boolean;
					startCursor: string | null;
					endCursor: string | null;
				};
			};
			assertToBeNonNullish(blockedUsers);
			expect(blockedUsers.edges).toHaveLength(3);
			expect(blockedUsers.pageInfo.hasNextPage).toBe(true);

			expect(blockedUsers.edges.length).toBeGreaterThan(0);

			const lastIndex = blockedUsers.edges.length - 1;
			const lastEdge = blockedUsers.edges[lastIndex];
			assertToBeNonNullish(lastEdge);
			const lastEdgeCursor = lastEdge.cursor;
			assertToBeNonNullish(lastEdgeCursor);

			const secondPageResult = await mercuriusClient.query(Query_organization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: orgId,
					},
					first: 10,
					after: lastEdgeCursor,
				},
			});

			const secondPageBlockedUsers = secondPageResult.data?.organization
				?.blockedUsers as {
				edges: Array<{ node: { id: string } }>;
				pageInfo: {
					hasNextPage: boolean;
					hasPreviousPage: boolean;
					startCursor: string | null;
					endCursor: string | null;
				};
			};
			assertToBeNonNullish(secondPageBlockedUsers);
			expect(secondPageBlockedUsers.edges).toHaveLength(1);
			expect(secondPageBlockedUsers.pageInfo.hasNextPage).toBe(false);
			expect(secondPageBlockedUsers.pageInfo.hasPreviousPage).toBe(true);
		});
	});

	suite("when a user is unblocked", () => {
		test("should no longer appear in the blocked users list", async () => {
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

			const adminId = adminUserId;
			assertToBeNonNullish(adminId);

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

			const { userId: userId1 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId1);
			const { userId: userId2 } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userId2);

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

			const beforeResult = await mercuriusClient.query(Query_organization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: orgId,
					},
					first: 10,
				},
			});

			const beforeBlockedUsers = beforeResult.data?.organization
				?.blockedUsers as {
				edges: Array<{ node: { id: string } }>;
				pageInfo: {
					hasNextPage: boolean;
					hasPreviousPage: boolean;
					startCursor: string | null;
					endCursor: string | null;
				};
			};
			assertToBeNonNullish(beforeBlockedUsers);

			expect(beforeBlockedUsers.edges).toHaveLength(2);

			await mercuriusClient.mutate(Mutation_unblockUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					organizationId: orgId,
					userId: userId1,
				},
			});

			const afterResult = await mercuriusClient.query(Query_organization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: orgId,
					},
					first: 10,
				},
			});

			const afterBlockedUsers = afterResult.data?.organization
				?.blockedUsers as {
				edges: Array<{ node: { id: string } }>;
				pageInfo: {
					hasNextPage: boolean;
					hasPreviousPage: boolean;
					startCursor: string | null;
					endCursor: string | null;
				};
			};
			assertToBeNonNullish(afterBlockedUsers);

			expect(afterBlockedUsers.edges).toHaveLength(1);

			const node = afterBlockedUsers.edges[0]?.node;
			assertToBeNonNullish(node);
			expect(node.id).toBe(userId2);
		});
	});
});
