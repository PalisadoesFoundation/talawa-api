import { faker } from "@faker-js/faker";
import { afterEach, beforeAll, expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createPost,
	Query_signIn,
} from "../documentNodes";

let authToken: string;

// Sign in once before tests
beforeAll(async () => {
	const signInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});
	assertToBeNonNullish(signInResult.data?.signIn);
	assertToBeNonNullish(signInResult.data.signIn.authenticationToken);
	authToken = signInResult.data.signIn.authenticationToken;
	assertToBeNonNullish(authToken);
});

afterEach(() => {
	vi.restoreAllMocks();
});

const OrganizationPostsCountQuery = `
  query OrgPostsCount($input: QueryOrganizationInput!) {
    organization(input: $input) {
      id
      postsCount
    }
  }
`;

suite("Organization postsCount Field", () => {
	test("unauthenticated client receives unauthenticated error for postsCount", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `PostsCount Test Org ${faker.string.uuid()}`,
						description: "Org to test postsCount",
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

		const result = await mercuriusClient.query(OrganizationPostsCountQuery, {
			variables: { input: { id: orgId } },
		});

		// postsCount should be null and error should indicate unauthenticated at that path
		expect(result.data?.organization?.postsCount).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthenticated" }),
					path: ["organization", "postsCount"],
				}),
			]),
		);
	});

	test("returns 0 when there are no posts", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `No Posts Org ${faker.string.uuid()}`,
						description: "Org with no posts",
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

		const result = await mercuriusClient.query(OrganizationPostsCountQuery, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: orgId } },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.organization?.postsCount).toBe(0);
	});

	test("returns correct posts count for authenticated administrator", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Posts Org ${faker.string.uuid()}`,
						description: "Org for posts count",
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

		// Create two posts in the organization
		for (const caption of ["Post One", "Post Two"]) {
			const createPostResult = await mercuriusClient.mutate(
				Mutation_createPost,
				{
					headers: { authorization: `Bearer ${authToken}` },
					variables: {
						input: {
							caption,
							organizationId: orgId,
						},
					},
				},
			);
			expect(createPostResult.errors).toBeUndefined();
			expect(createPostResult.data?.createPost).toBeDefined();
		}

		const result = await mercuriusClient.query(OrganizationPostsCountQuery, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: orgId } },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.organization?.postsCount).toBe(2);
	});

	test("non-admin non-member gets unauthorized_action when querying postsCount", async () => {
		// create an organization as admin
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Unauthorized Posts Org ${faker.string.uuid()}`,
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

		const result = await mercuriusClient.query(OrganizationPostsCountQuery, {
			headers: { authorization: `Bearer ${regularAuthToken}` },
			variables: { input: { id: orgId } },
		});

		expect(result.data?.organization?.postsCount).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({ code: "unauthorized_action" }),
					path: ["organization", "postsCount"],
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
						name: `Missing User Org ${faker.string.uuid()}`,
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
			const result = await mercuriusClient.query(OrganizationPostsCountQuery, {
				headers: { authorization: `Bearer ${authToken}` },
				variables: { input: { id: orgId } },
			});

			expect(result.data?.organization?.postsCount).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["organization", "postsCount"],
					}),
				]),
			);
		} finally {
			findFirstSpy.mockRestore();
		}
	});

	test.sequential("returns 0 when posts select returns an empty array (postsCount undefined branch)", async () => {
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Empty Select Org ${faker.string.uuid()}`,
						description: "Org to test postsCount undefined",
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
			const result = await mercuriusClient.query(OrganizationPostsCountQuery, {
				headers: { authorization: `Bearer ${authToken}` },
				variables: { input: { id: orgId } },
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.organization?.postsCount).toBe(0);
		} finally {
			server.drizzleClient.select = originalSelect;
		}
	});
});
