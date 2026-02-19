import { faker } from "@faker-js/faker";
import { afterEach, beforeAll, expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createPost,
} from "../documentNodes";

let authToken: string;

beforeAll(async () => {
	const { accessToken } = await getAdminAuthViaRest(server);
	assertToBeNonNullish(accessToken);
	authToken = accessToken;
});

afterEach(() => {
	vi.restoreAllMocks();
});

const OrganizationPinnedPostsCountQuery = `
  query OrgPinnedPostsCount($input: QueryOrganizationInput!) {
    organization(input: $input) {
      id
      pinnedPostsCount
    }
  }
`;

suite("Organization pinnedPostsCount Field", () => {
	test("unauthenticated client receives unauthenticated error for pinnedPostsCount", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `PinnedPostsCount Test Org ${faker.string.uuid()}`,
						description: "Org to test pinnedPostsCount",
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

		const result = await mercuriusClient.query(
			OrganizationPinnedPostsCountQuery,
			{
				variables: { input: { id: orgId } },
			},
		);

		// pinnedPostsCount should be null and error should indicate unauthenticated at that path
		expect(result.data?.organization?.pinnedPostsCount).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
					path: ["organization", "pinnedPostsCount"],
				}),
			]),
		);
	});

	test("returns 0 when there are no pinned posts", async () => {
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

		const result = await mercuriusClient.query(
			OrganizationPinnedPostsCountQuery,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: { input: { id: orgId } },
			},
		);

		expect(result.errors).toBeUndefined();
		expect(result.data?.organization?.pinnedPostsCount).toBe(0);
	});

	test("returns correct pinned posts count for authenticated administrator", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Pinned Posts Org ${faker.string.uuid()}`,
						description: "Org for pinned posts count",
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

		// Create two pinned posts in the organization
		for (const caption of ["Pinned Post One", "Pinned Post Two"]) {
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
			expect(createPostResult.data?.createPost).toBeDefined();
		}

		const result = await mercuriusClient.query(
			OrganizationPinnedPostsCountQuery,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: { input: { id: orgId } },
			},
		);

		expect(result.errors).toBeUndefined();
		expect(result.data?.organization?.pinnedPostsCount).toBe(2);
	});

	test("non-admin non-member gets unauthorized_action when querying pinnedPostsCount", async () => {
		// create an organization as admin
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

		// create a regular user
		const { authToken: regularAuthToken } = await import(
			"../createRegularUserUsingAdmin"
		).then((m) => m.createRegularUserUsingAdmin());
		assertToBeNonNullish(regularAuthToken);

		const result = await mercuriusClient.query(
			OrganizationPinnedPostsCountQuery,
			{
				headers: { authorization: `Bearer ${regularAuthToken}` },
				variables: { input: { id: orgId } },
			},
		);

		expect(result.data?.organization?.pinnedPostsCount).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthorized_action" }),
					path: ["organization", "pinnedPostsCount"],
				}),
			]),
		);
	});

	test("throws unauthenticated when current user is not found in database", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Missing User Pinned Posts Org ${faker.string.uuid()}`,
						description: "Org to test missing current user",
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

		try {
			const result = await mercuriusClient.query(
				OrganizationPinnedPostsCountQuery,
				{
					headers: { authorization: `Bearer ${authToken}` },
					variables: { input: { id: orgId } },
				},
			);

			expect(result.data?.organization?.pinnedPostsCount).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["organization", "pinnedPostsCount"],
					}),
				]),
			);
		} finally {
			findFirstSpy.mockRestore();
		}
	});

	test.sequential("returns 0 when posts select returns an empty array (pinnedPostsCount undefined branch)", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Empty Select Pinned Posts Org ${faker.string.uuid()}`,
						description: "Org to test pinnedPostsCount undefined",
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

		const originalSelect = server.drizzleClient.select;
		// Assign a minimal mock implementation that matches the runtime shape used by the resolver.
		server.drizzleClient.select = ((): unknown => ({
			from: () => ({ where: async () => [] }),
		})) as unknown as typeof originalSelect;

		try {
			const result = await mercuriusClient.query(
				OrganizationPinnedPostsCountQuery,
				{
					headers: { authorization: `Bearer ${authToken}` },
					variables: { input: { id: orgId } },
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.organization?.pinnedPostsCount).toBe(0);
		} finally {
			server.drizzleClient.select = originalSelect;
		}
	});
});
