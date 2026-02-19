import { faker } from "@faker-js/faker";
import { gql } from "graphql-tag";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteCurrentUser,
} from "../documentNodes";

const Mutation_createAdvertisement = gql`
  mutation createAdvertisement($input: MutationCreateAdvertisementInput!) {
    createAdvertisement(input: $input) {
      id
      name
      description
      type
      startAt
      endAt
      attachments {
        url
        mimeType
      }
      organization {
        id
      }
    }
  }
`;

const Mutation_deleteAdvertisement = gql`
  mutation deleteAdvertisement($input: MutationDeleteAdvertisementInput!) {
    deleteAdvertisement(input: $input) {
      id
      name
      description
      type
      attachments {
        url
        mimeType
      }
    }
  }
`;

// Constants
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const SUITE_TIMEOUT = 40_000;

// Helper function to create test organization
async function createTestOrganization(token: string) {
	const result = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${token}` },
		variables: {
			input: {
				name: `${faker.company.name()} ${faker.string.ulid()}`,
				description: faker.lorem.sentence(),
				countryCode: "us",
				state: "CA",
				city: "San Francisco",
				postalCode: "94101",
				addressLine1: faker.location.streetAddress(),
			},
		},
	});
	if (result.errors) {
		throw new Error(
			`Failed to create test organization: ${JSON.stringify(result.errors)}`,
		);
	}
	const orgId = result.data?.createOrganization?.id;
	assertToBeNonNullish(orgId);
	return orgId;
}

// Helper function to create an advertisement
async function createTestAdvertisement(token: string, organizationId: string) {
	const result = await mercuriusClient.mutate(Mutation_createAdvertisement, {
		headers: { authorization: `bearer ${token}` },
		variables: {
			input: {
				name: `Test Ad ${faker.string.uuid()}`,
				description: "Test advertisement for deletion",
				organizationId,
				type: "banner",
				startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
				endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
			},
		},
	});
	if (result.errors) {
		throw new Error(
			`Failed to create test advertisement: ${JSON.stringify(result.errors)}`,
		);
	}
	const adId = result.data?.createAdvertisement?.id;
	assertToBeNonNullish(adId);
	return adId;
}

const { accessToken: authToken } = await getAdminAuthViaRest(server);
assertToBeNonNullish(authToken);

suite("Mutation field deleteAdvertisement", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_deleteAdvertisement,
				{
					variables: {
						input: {
							id: faker.string.uuid(),
						},
					},
				},
			);

			expect(result.data?.deleteAdvertisement).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["deleteAdvertisement"],
					}),
				]),
			);
		});
	});

	suite("when arguments are invalid", () => {
		test("should return an error with invalid_arguments extensions code for invalid id", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_deleteAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: "not-a-valid-uuid",
						},
					},
				},
			);

			expect(result.data?.deleteAdvertisement).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "id"],
								}),
							]),
						}),
						path: ["deleteAdvertisement"],
					}),
				]),
			);
		});
	});

	suite("when the current user does not exist", () => {
		test(
			"should return an error with unauthenticated extensions code",
			async () => {
				const { authToken: userToken } = await createRegularUserUsingAdmin();
				assertToBeNonNullish(userToken);

				await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
					headers: { authorization: `bearer ${userToken}` },
				});

				const result = await mercuriusClient.mutate(
					Mutation_deleteAdvertisement,
					{
						headers: { authorization: `bearer ${userToken}` },
						variables: {
							input: {
								id: faker.string.uuid(),
							},
						},
					},
				);

				expect(result.data?.deleteAdvertisement).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({ code: "unauthenticated" }),
							path: ["deleteAdvertisement"],
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when the advertisement does not exist", () => {
		test(
			"should return an error with arguments_associated_resources_not_found extensions code",
			async () => {
				const result = await mercuriusClient.mutate(
					Mutation_deleteAdvertisement,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								id: faker.string.uuid(),
							},
						},
					},
				);

				expect(result.data?.deleteAdvertisement).toBeNull();
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
							path: ["deleteAdvertisement"],
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when the client is not authorized", () => {
		test(
			"should return an error when user is not a member of the organization",
			async () => {
				const orgId = await createTestOrganization(authToken);
				const adId = await createTestAdvertisement(authToken, orgId);

				const { authToken: regularAuthToken } =
					await createRegularUserUsingAdmin();
				assertToBeNonNullish(regularAuthToken);

				const result = await mercuriusClient.mutate(
					Mutation_deleteAdvertisement,
					{
						headers: { authorization: `bearer ${regularAuthToken}` },
						variables: {
							input: {
								id: adId,
							},
						},
					},
				);

				expect(result.data?.deleteAdvertisement).toBeNull();
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
							path: ["deleteAdvertisement"],
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);

		test(
			"should return an error when user is a regular member (not admin) of the organization",
			async () => {
				const orgId = await createTestOrganization(authToken);
				const adId = await createTestAdvertisement(authToken, orgId);

				const { authToken: regularAuthToken, userId: regularUserId } =
					await createRegularUserUsingAdmin();
				assertToBeNonNullish(regularAuthToken);

				// Add regular user as a member of the organization
				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							role: "regular",
							organizationId: orgId,
							memberId: regularUserId,
						},
					},
				});

				const result = await mercuriusClient.mutate(
					Mutation_deleteAdvertisement,
					{
						headers: { authorization: `bearer ${regularAuthToken}` },
						variables: {
							input: {
								id: adId,
							},
						},
					},
				);

				expect(result.data?.deleteAdvertisement).toBeNull();
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
							path: ["deleteAdvertisement"],
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when the client is authorized", () => {
		test(
			"should allow system administrator to delete advertisement",
			async () => {
				const orgId = await createTestOrganization(authToken);
				const adId = await createTestAdvertisement(authToken, orgId);

				const result = await mercuriusClient.mutate(
					Mutation_deleteAdvertisement,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								id: adId,
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.deleteAdvertisement).toEqual(
					expect.objectContaining({
						id: adId,
					}),
				);
			},
			SUITE_TIMEOUT,
		);

		test(
			"should allow organization administrator to delete advertisement",
			async () => {
				const { authToken: orgAdminToken, userId: orgAdminId } =
					await createRegularUserUsingAdmin();
				assertToBeNonNullish(orgAdminToken);

				const orgId = await createTestOrganization(authToken);
				const adId = await createTestAdvertisement(authToken, orgId);

				// Add user as admin of the organization
				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							role: "administrator",
							organizationId: orgId,
							memberId: orgAdminId,
						},
					},
				});

				const result = await mercuriusClient.mutate(
					Mutation_deleteAdvertisement,
					{
						headers: { authorization: `bearer ${orgAdminToken}` },
						variables: {
							input: {
								id: adId,
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.deleteAdvertisement).toEqual(
					expect.objectContaining({
						id: adId,
					}),
				);
			},
			SUITE_TIMEOUT,
		);
	});

	suite(
		"when the deletion transaction returns no deleted advertisement",
		() => {
			test(
				"should return an error with unexpected extensions code",
				async () => {
					const orgId = await createTestOrganization(authToken);
					const adId = await createTestAdvertisement(authToken, orgId);

					const originalTransaction = server.drizzleClient.transaction;
					const fakeTransaction = async <T>(
						fn: (tx: unknown) => Promise<T>,
					): Promise<T> => {
						return await fn({
							delete: () => ({
								where: () => ({
									returning: async () => {
										return [];
									},
								}),
							}),
						});
					};

					try {
						server.drizzleClient.transaction =
							fakeTransaction as typeof server.drizzleClient.transaction;

						const result = await mercuriusClient.mutate(
							Mutation_deleteAdvertisement,
							{
								headers: { authorization: `bearer ${authToken}` },
								variables: {
									input: {
										id: adId,
									},
								},
							},
						);

						expect(result.data?.deleteAdvertisement ?? null).toBeNull();
						expect(result.errors).toEqual(
							expect.arrayContaining([
								expect.objectContaining({
									extensions: expect.objectContaining({
										code: "unexpected",
									}),
									path: ["deleteAdvertisement"],
								}),
							]),
						);
					} finally {
						server.drizzleClient.transaction = originalTransaction;
					}
				},
				SUITE_TIMEOUT,
			);
		},
	);

	suite("when advertisement is deleted successfully", () => {
		test(
			"should return the deleted advertisement with attachments",
			async () => {
				const orgId = await createTestOrganization(authToken);
				const adId = await createTestAdvertisement(authToken, orgId);

				const result = await mercuriusClient.mutate(
					Mutation_deleteAdvertisement,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								id: adId,
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				assertToBeNonNullish(result.data?.deleteAdvertisement);
				expect(result.data.deleteAdvertisement.id).toEqual(adId);
				expect(result.data.deleteAdvertisement.name).toBeDefined();
				expect(result.data.deleteAdvertisement.description).toBeDefined();
				expect(result.data.deleteAdvertisement.type).toBe("banner");
				expect(Array.isArray(result.data.deleteAdvertisement.attachments)).toBe(
					true,
				);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when minio removal fails", () => {
		test(
			"should bubble up an error from the minio removal and not delete the advertisement",
			async () => {
				const orgId = await createTestOrganization(authToken);
				const adId = await createTestAdvertisement(authToken, orgId);

				const originalRemoveObjects = server.minio.client.removeObjects;
				try {
					server.minio.client.removeObjects = async () => {
						throw new Error("Minio removal error");
					};

					const result = await mercuriusClient.mutate(
						Mutation_deleteAdvertisement,
						{
							headers: { authorization: `bearer ${authToken}` },
							variables: {
								input: {
									id: adId,
								},
							},
						},
					);

					expect(result.data?.deleteAdvertisement ?? null).toBeNull();
					expect(result.errors).toBeDefined();
					expect(result.errors?.[0]?.message).toContain("Minio removal error");
				} finally {
					server.minio.client.removeObjects = originalRemoveObjects;
				}
			},
			SUITE_TIMEOUT,
		);
	});
});
