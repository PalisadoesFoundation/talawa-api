import { faker } from "@faker-js/faker";
import { afterEach, beforeAll, expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import {
	Mutation_createAdvertisement,
	Mutation_createOrganization,
	Query_signIn,
} from "../../../routes/graphql/documentNodes";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";

// Inline GraphQL query to avoid schema issues
const Query_advertisement = /* GraphQL */ `
  query Advertisement($input: QueryAdvertisementInput!) {
    advertisement(input: $input) {
      id
      name
      description
      type
      startAt
      endAt
      createdAt
      organization {
        id
      }
      attachments {
        mimeType
        url
      }
    }
  }
`;

let authToken: string;

beforeAll(async () => {
	const signInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});
	expect(signInResult.errors).toBeUndefined();
	assertToBeNonNullish(signInResult.data?.signIn);
	assertToBeNonNullish(signInResult.data.signIn.authenticationToken);
	authToken = signInResult.data.signIn.authenticationToken;
});

afterEach(() => {
	vi.restoreAllMocks();
});

suite("Query.advertisement", () => {
	test("should throw unauthenticated error if not logged in", async () => {
		const result = await mercuriusClient.query(Query_advertisement, {
			variables: { input: { id: faker.string.uuid() } },
		});

		expect(result.data?.advertisement).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
				}),
			]),
		);
	});

	test("should throw unauthenticated error when current user not found in database", async () => {
		const findFirstSpy = vi
			.spyOn(server.drizzleClient.query.usersTable, "findFirst")
			.mockResolvedValueOnce(undefined);

		const result = await mercuriusClient.query(Query_advertisement, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: faker.string.uuid() } },
		});

		expect(findFirstSpy).toHaveBeenCalled();
		expect(result.data?.advertisement).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthenticated",
					}),
				}),
			]),
		);
	});

	test("should throw invalid arguments error for malformed input", async () => {
		const result = await mercuriusClient.query(Query_advertisement, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: "" } }, // Invalid empty ID
		});

		expect(result.data?.advertisement).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
					}),
				}),
			]),
		);
	});

	test("should throw arguments_associated_resources_not_found for non-existent advertisement", async () => {
		const result = await mercuriusClient.query(Query_advertisement, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: faker.string.uuid() } },
		});

		expect(result.data?.advertisement).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "id"],
							}),
						]),
					}),
				}),
			]),
		);
	});

	test("should throw unauthorized error for non-admin user without organization membership", async () => {
		// Create organization and advertisement with admin
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Test Org ${faker.string.uuid()}`,
						description: "Test organization",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		const createAdResult = await mercuriusClient.mutate(
			Mutation_createAdvertisement,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: `Test Ad ${faker.string.uuid()}`,
						description: "Test advertisement",
						type: "pop_up",
						startAt: new Date().toISOString(),
						endAt: new Date(Date.now() + 86400000).toISOString(),
					},
				},
			},
		);
		const adId = createAdResult.data?.createAdvertisement?.id;
		assertToBeNonNullish(adId);

		// Create regular user and try to access
		const { authToken: regularToken } = await createRegularUserUsingAdmin();

		const result = await mercuriusClient.query(Query_advertisement, {
			headers: { authorization: `Bearer ${regularToken}` },
			variables: { input: { id: adId } },
		});

		expect(result.data?.advertisement).toBeNull();
		expect(result.errors).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "unauthorized_action_on_arguments_associated_resources",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "id"],
							}),
						]),
					}),
				}),
			]),
		);
	});

	test("should return advertisement for global administrator accessing any organization", async () => {
		// Create regular user and make them create org/ad
		const { authToken: regularToken } = await createRegularUserUsingAdmin();

		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${regularToken}` },
				variables: {
					input: {
						name: `Test Org ${faker.string.uuid()}`,
						description: "Test organization",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		const adName = `Test Ad ${faker.string.uuid()}`;
		const createAdResult = await mercuriusClient.mutate(
			Mutation_createAdvertisement,
			{
				headers: { authorization: `Bearer ${regularToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: adName,
						description: "Test advertisement",
						type: "pop_up",
						startAt: new Date().toISOString(),
						endAt: new Date(Date.now() + 86400000).toISOString(),
					},
				},
			},
		);
		const adId = createAdResult.data?.createAdvertisement?.id;
		assertToBeNonNullish(adId);

		// Global admin should access advertisement from any organization
		const result = await mercuriusClient.query(Query_advertisement, {
			headers: { authorization: `Bearer ${authToken}` }, // Global admin token
			variables: { input: { id: adId } },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.advertisement).toBeDefined();
		expect(result.data?.advertisement?.id).toBe(adId);
		expect(result.data?.advertisement?.name).toBe(adName);
	});

	test("should return advertisement for valid request", async () => {
		// Create organization and advertisement
		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						name: `Test Org ${faker.string.uuid()}`,
						description: "Test organization",
					},
				},
			},
		);
		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		const adName = `Test Ad ${faker.string.uuid()}`;
		const createAdResult = await mercuriusClient.mutate(
			Mutation_createAdvertisement,
			{
				headers: { authorization: `Bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						name: adName,
						description: "Test advertisement",
						type: "pop_up",
						startAt: new Date().toISOString(),
						endAt: new Date(Date.now() + 86400000).toISOString(),
					},
				},
			},
		);
		const adId = createAdResult.data?.createAdvertisement?.id;
		assertToBeNonNullish(adId);

		const result = await mercuriusClient.query(Query_advertisement, {
			headers: { authorization: `Bearer ${authToken}` },
			variables: { input: { id: adId } },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data?.advertisement).toBeDefined();
		expect(result.data?.advertisement?.id).toBe(adId);
		expect(result.data?.advertisement?.name).toBe(adName);
		expect(result.data?.advertisement?.attachments).toBeDefined();
	});
});
