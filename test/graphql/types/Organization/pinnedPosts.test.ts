import { faker } from "@faker-js/faker";
import { afterEach, beforeAll, expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createPost,
	Mutation_joinPublicOrganization,
} from "../documentNodes";

let authToken: string;

beforeAll(async () => {
	const { accessToken } = await getAdminAuthViaRest(server);
	authToken = accessToken;
});

afterEach(() => {
	vi.restoreAllMocks();
});

const OrganizationPinnedPostsQuery = `
  query OrgPinnedPosts($input: QueryOrganizationInput!, $first: Int, $after: String, $last: Int, $before: String) {
    organization(input: $input) {
      id
      pinnedPosts(first: $first, after: $after, last: $last, before: $before) {
        edges {
          node {
            id
            caption
            pinnedAt
          }
          cursor
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  }
`;

suite("Organization pinnedPosts Field", () => {
	test("should throw unauthenticated error if not logged in", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `PinnedPosts Test Org ${faker.string.uuid()}`,
						description: "Org to test pinnedPosts",
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

		const result = await mercuriusClient.query(OrganizationPinnedPostsQuery, {
			variables: { input: { id: orgId }, first: 10 },
		});

		expect(result.data?.organization?.pinnedPosts).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
					path: ["organization", "pinnedPosts"],
				}),
			]),
		);
	});

	test("should throw unauthenticated error when current user not found in database", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Missing User Org ${faker.string.uuid()}`,
						description: "Org to test missing user",
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

		const findFirstSpy = vi
			.spyOn(server.drizzleClient.query.usersTable, "findFirst")
			.mockResolvedValueOnce(undefined);

		const result = await mercuriusClient.query(OrganizationPinnedPostsQuery, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: orgId }, first: 10 },
		});

		expect(findFirstSpy).toHaveBeenCalled();
		expect(result.data?.organization?.pinnedPosts).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
					path: ["organization", "pinnedPosts"],
				}),
			]),
		);
	});

	test("should throw unauthorized error for non-member", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Unauthorized Pinned Posts Org ${faker.string.uuid()}`,
						description: "Org to test unauthorized access",
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

		const { authToken: regularAuthToken } = await import(
			"../createRegularUserUsingAdmin"
		).then((m) => m.createRegularUserUsingAdmin());

		const result = await mercuriusClient.query(OrganizationPinnedPostsQuery, {
			headers: { authorization: `Bearer ${regularAuthToken}` },
			variables: { input: { id: orgId }, first: 10 },
		});

		expect(result.data?.organization?.pinnedPosts).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthorized_action" }),
					path: ["organization", "pinnedPosts"],
				}),
			]),
		);
	});

	test("should throw invalid argument error for bad cursor", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Invalid Cursor Org ${faker.string.uuid()}`,
						description: "Org to test invalid cursor",
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

		const result = await mercuriusClient.query(OrganizationPinnedPostsQuery, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: orgId }, first: 10, after: "invalid-cursor" },
		});

		expect(result.data?.organization?.pinnedPosts).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["after"],
							}),
						]),
					}),
				}),
			]),
		);
	});

	test("should throw invalid argument error for bad cursor in before parameter", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Invalid Before Cursor Org ${faker.string.uuid()}`,
						description: "Org to test invalid before cursor",
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

		const result = await mercuriusClient.query(OrganizationPinnedPostsQuery, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: orgId }, last: 10, before: "invalid-cursor" },
		});

		expect(result.data?.organization?.pinnedPosts).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["before"],
							}),
						]),
					}),
				}),
			]),
		);
	});

	test("should throw resource not found if cursor returns no results (after)", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Non-existent Cursor Org ${faker.string.uuid()}`,
						description: "Org to test non-existent cursor",
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

		const fakeCursor = Buffer.from(
			JSON.stringify({
				id: faker.string.uuid(),
				pinnedAt: new Date().toISOString(),
			}),
		).toString("base64url");

		const result = await mercuriusClient.query(OrganizationPinnedPostsQuery, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: orgId }, first: 10, after: fakeCursor },
		});

		expect(result.data?.organization?.pinnedPosts).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["after"],
							}),
						]),
					}),
				}),
			]),
		);
	});

	test("should throw resource not found if cursor returns no results (before)", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Non-existent Before Cursor Org ${faker.string.uuid()}`,
						description: "Org to test non-existent before cursor",
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

		const fakeCursor = Buffer.from(
			JSON.stringify({
				id: faker.string.uuid(),
				pinnedAt: new Date().toISOString(),
			}),
		).toString("base64url");

		const result = await mercuriusClient.query(OrganizationPinnedPostsQuery, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: orgId }, last: 10, before: fakeCursor },
		});

		expect(result.data?.organization?.pinnedPosts).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["before"],
							}),
						]),
					}),
				}),
			]),
		);
	});

	test("should return empty connection when no pinned posts exist", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `No Pinned Posts Org ${faker.string.uuid()}`,
						description: "Org with no pinned posts",
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

		const result = await mercuriusClient.query(OrganizationPinnedPostsQuery, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: orgId }, first: 10 },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.organization?.pinnedPosts?.edges).toEqual([]);
		expect(result.data?.organization?.pinnedPosts?.pageInfo).toEqual({
			hasNextPage: false,
			hasPreviousPage: false,
			startCursor: null,
			endCursor: null,
		});
	});

	test("should return pinned posts for authenticated administrator", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Pinned Posts Org ${faker.string.uuid()}`,
						description: "Org for pinned posts",
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

		// Create pinned posts
		const postCaptions = ["First Pinned Post", "Second Pinned Post"];
		for (const caption of postCaptions) {
			const createPostResult = await mercuriusClient.mutate(
				Mutation_createPost,
				{
					headers: { authorization: `Bearer ${authToken}` },
					variables: {
						input: {
							caption,
							organizationId: orgId,
							isPinned: true,
						},
					},
				},
			);
			expect(createPostResult.errors).toBeUndefined();
		}

		const result = await mercuriusClient.query(OrganizationPinnedPostsQuery, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: orgId }, first: 10 },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.organization?.pinnedPosts?.edges).toHaveLength(2);
		expect(
			result.data?.organization?.pinnedPosts?.edges?.[0]?.node?.pinnedAt,
		).toBeTruthy();
		expect(
			result.data?.organization?.pinnedPosts?.edges?.[0]?.cursor,
		).toBeTruthy();
	});

	test("should handle pagination with valid cursor (forward)", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Pagination Org ${faker.string.uuid()}`,
						description: "Org for pagination test",
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

		// Create multiple pinned posts
		for (let i = 0; i < 3; i++) {
			await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						caption: `Pinned Post ${i}`,
						organizationId: orgId,
						isPinned: true,
					},
				},
			});
		}

		// Get first page
		const firstResult = await mercuriusClient.query(
			OrganizationPinnedPostsQuery,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: { input: { id: orgId }, first: 2 },
			},
		);

		expect(firstResult.errors).toBeUndefined();
		expect(firstResult.data?.organization?.pinnedPosts?.edges).toHaveLength(2);
		expect(
			firstResult.data?.organization?.pinnedPosts?.pageInfo?.hasNextPage,
		).toBe(true);

		// Get second page using cursor
		const cursor =
			firstResult.data?.organization?.pinnedPosts?.pageInfo?.endCursor;
		assertToBeNonNullish(cursor);

		const secondResult = await mercuriusClient.query(
			OrganizationPinnedPostsQuery,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: { input: { id: orgId }, first: 2, after: cursor },
			},
		);

		expect(secondResult.errors).toBeUndefined();
		expect(secondResult.data?.organization?.pinnedPosts?.edges).toHaveLength(1);
		expect(
			secondResult.data?.organization?.pinnedPosts?.pageInfo?.hasNextPage,
		).toBe(false);
	});

	test("should return pinned posts for authenticated organization member (non-admin)", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Member Access Org ${faker.string.uuid()}`,
						description: "Org to test member access",
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

		const { authToken: memberAuthToken } = await import(
			"../createRegularUserUsingAdmin"
		).then((m) => m.createRegularUserUsingAdmin());

		const joinResult = await mercuriusClient.mutate(
			Mutation_joinPublicOrganization,
			{
				headers: { authorization: `Bearer ${memberAuthToken}` },
				variables: {
					input: {
						organizationId: orgId,
					},
				},
			},
		);
		expect(joinResult.errors).toBeUndefined();

		await mercuriusClient.mutate(Mutation_createPost, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: {
				input: {
					caption: "Member Test Post",
					organizationId: orgId,
					isPinned: true,
				},
			},
		});

		const result = await mercuriusClient.query(OrganizationPinnedPostsQuery, {
			headers: { authorization: `Bearer ${memberAuthToken}` },
			variables: { input: { id: orgId }, first: 10 },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.organization?.pinnedPosts?.edges).toHaveLength(1);
		expect(
			result.data?.organization?.pinnedPosts?.edges?.[0]?.node?.caption,
		).toBe("Member Test Post");
	});

	test("should handle backward pagination without cursor (last only)", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Backward No Cursor Org ${faker.string.uuid()}`,
						description: "Org for backward pagination without cursor",
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

		for (let i = 0; i < 3; i++) {
			await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						caption: `Last Only Post ${i}`,
						organizationId: orgId,
						isPinned: true,
					},
				},
			});
		}

		const result = await mercuriusClient.query(OrganizationPinnedPostsQuery, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: orgId }, last: 2 },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.organization?.pinnedPosts?.edges).toHaveLength(2);
		expect(
			result.data?.organization?.pinnedPosts?.pageInfo?.hasPreviousPage,
		).toBe(true);
		expect(
			result.data?.organization?.pinnedPosts?.pageInfo?.startCursor,
		).toBeTruthy();
	});

	test("should handle backward pagination with valid cursor (last + before)", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Backward With Cursor Org ${faker.string.uuid()}`,
						description: "Org for backward pagination with cursor",
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

		for (let i = 0; i < 3; i++) {
			await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						caption: `Backward Cursor Post ${i}`,
						organizationId: orgId,
						isPinned: true,
					},
				},
			});
		}

		const allResult = await mercuriusClient.query(
			OrganizationPinnedPostsQuery,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: { input: { id: orgId }, first: 10 },
			},
		);

		expect(allResult.errors).toBeUndefined();
		expect(allResult.data?.organization?.pinnedPosts?.edges).toHaveLength(3);

		const secondPostCursor =
			allResult.data?.organization?.pinnedPosts?.edges?.[1]?.cursor;
		assertToBeNonNullish(secondPostCursor);

		const backwardResult = await mercuriusClient.query(
			OrganizationPinnedPostsQuery,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: { input: { id: orgId }, last: 1, before: secondPostCursor },
			},
		);

		expect(backwardResult.errors).toBeUndefined();
		expect(backwardResult.data?.organization?.pinnedPosts?.edges).toHaveLength(
			1,
		);
		expect(
			backwardResult.data?.organization?.pinnedPosts?.pageInfo?.hasPreviousPage,
		).toBe(false);
	});
});
