import { faker } from "@faker-js/faker";
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
	Mutation_deleteOrganizationMembership,
} from "../documentNodes";

// Constants
const SUITE_TIMEOUT = 40_000;

// Helper function to create test organization
async function createTestOrganization(token: string) {
	const result = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${token}` },
		variables: {
			input: {
				name: `Test Org ${faker.string.ulid()}`,
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

// Helper function to create a membership
async function createTestMembership(
	token: string,
	organizationId: string,
	memberId: string,
	role: "regular" | "administrator" = "regular",
) {
	const result = await mercuriusClient.mutate(
		Mutation_createOrganizationMembership,
		{
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					organizationId,
					memberId,
					role,
				},
			},
		},
	);
	if (result.errors) {
		throw new Error(
			`Failed to create membership: ${JSON.stringify(result.errors)}`,
		);
	}
	return result.data?.createOrganizationMembership?.id;
}

const { accessToken: authToken } = await getAdminAuthViaRest(server);
assertToBeNonNullish(authToken);

suite("Mutation field deleteOrganizationMembership", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_deleteOrganizationMembership,
				{
					variables: {
						input: {
							memberId: faker.string.uuid(),
							organizationId: faker.string.uuid(),
						},
					},
				},
			);

			expect(result.data?.deleteOrganizationMembership).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["deleteOrganizationMembership"],
					}),
				]),
			);
		});
	});

	suite("when arguments are invalid", () => {
		test("should return an error for invalid memberId", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_deleteOrganizationMembership,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							memberId: "not-a-valid-uuid",
							organizationId: faker.string.uuid(),
						},
					},
				},
			);

			expect(result.data?.deleteOrganizationMembership).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining(["input", "memberId"]),
								}),
							]),
						}),
						path: ["deleteOrganizationMembership"],
					}),
				]),
			);
		});

		test("should return an error for invalid organizationId", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_deleteOrganizationMembership,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							memberId: faker.string.uuid(),
							organizationId: "not-a-valid-uuid",
						},
					},
				},
			);

			expect(result.data?.deleteOrganizationMembership).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining([
										"input",
										"organizationId",
									]),
								}),
							]),
						}),
						path: ["deleteOrganizationMembership"],
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
					Mutation_deleteOrganizationMembership,
					{
						headers: { authorization: `bearer ${userToken}` },
						variables: {
							input: {
								memberId: faker.string.uuid(),
								organizationId: faker.string.uuid(),
							},
						},
					},
				);

				expect(result.data?.deleteOrganizationMembership).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({ code: "unauthenticated" }),
							path: ["deleteOrganizationMembership"],
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when resources are not found", () => {
		test(
			"should return an error when both member and organization do not exist",
			async () => {
				const result = await mercuriusClient.mutate(
					Mutation_deleteOrganizationMembership,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								memberId: faker.string.uuid(),
								organizationId: faker.string.uuid(),
							},
						},
					},
				);

				expect(result.data?.deleteOrganizationMembership).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "arguments_associated_resources_not_found",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "memberId"],
									}),
									expect.objectContaining({
										argumentPath: ["input", "organizationId"],
									}),
								]),
							}),
							path: ["deleteOrganizationMembership"],
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);

		test(
			"should return an error when member does not exist but organization does",
			async () => {
				const orgId = await createTestOrganization(authToken);

				const result = await mercuriusClient.mutate(
					Mutation_deleteOrganizationMembership,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								memberId: faker.string.uuid(),
								organizationId: orgId,
							},
						},
					},
				);

				expect(result.data?.deleteOrganizationMembership).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "arguments_associated_resources_not_found",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "memberId"],
									}),
								]),
							}),
							path: ["deleteOrganizationMembership"],
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);

		test(
			"should return an error when organization does not exist but member does",
			async () => {
				const { userId } = await createRegularUserUsingAdmin();

				const result = await mercuriusClient.mutate(
					Mutation_deleteOrganizationMembership,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								memberId: userId,
								organizationId: faker.string.uuid(),
							},
						},
					},
				);

				expect(result.data?.deleteOrganizationMembership).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "arguments_associated_resources_not_found",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "organizationId"],
									}),
								]),
							}),
							path: ["deleteOrganizationMembership"],
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);

		test(
			"should return an error when membership does not exist",
			async () => {
				const { userId } = await createRegularUserUsingAdmin();
				const orgId = await createTestOrganization(authToken);

				const result = await mercuriusClient.mutate(
					Mutation_deleteOrganizationMembership,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								memberId: userId,
								organizationId: orgId,
							},
						},
					},
				);

				expect(result.data?.deleteOrganizationMembership).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "arguments_associated_resources_not_found",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "memberId"],
									}),
									expect.objectContaining({
										argumentPath: ["input", "organizationId"],
									}),
								]),
							}),
							path: ["deleteOrganizationMembership"],
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
				const { authToken: regularAuthToken } =
					await createRegularUserUsingAdmin();
				assertToBeNonNullish(regularAuthToken);

				const orgId = await createTestOrganization(authToken);
				const { userId: targetUserId } = await createRegularUserUsingAdmin();
				await createTestMembership(authToken, orgId, targetUserId);

				const result = await mercuriusClient.mutate(
					Mutation_deleteOrganizationMembership,
					{
						headers: { authorization: `bearer ${regularAuthToken}` },
						variables: {
							input: {
								memberId: targetUserId,
								organizationId: orgId,
							},
						},
					},
				);

				expect(result.data?.deleteOrganizationMembership).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unauthorized_action_on_arguments_associated_resources",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "memberId"],
									}),
									expect.objectContaining({
										argumentPath: ["input", "organizationId"],
									}),
								]),
							}),
							path: ["deleteOrganizationMembership"],
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);

		test(
			"should return an error when regular member tries to delete another member",
			async () => {
				const orgId = await createTestOrganization(authToken);

				// Create first regular user and add as member
				const { authToken: regularAuthToken, userId: regularUserId } =
					await createRegularUserUsingAdmin();
				assertToBeNonNullish(regularAuthToken);
				await createTestMembership(authToken, orgId, regularUserId, "regular");

				// Create second user and add as member
				const { userId: targetUserId } = await createRegularUserUsingAdmin();
				await createTestMembership(authToken, orgId, targetUserId, "regular");

				const result = await mercuriusClient.mutate(
					Mutation_deleteOrganizationMembership,
					{
						headers: { authorization: `bearer ${regularAuthToken}` },
						variables: {
							input: {
								memberId: targetUserId,
								organizationId: orgId,
							},
						},
					},
				);

				expect(result.data?.deleteOrganizationMembership).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unauthorized_action_on_arguments_associated_resources",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "memberId"],
									}),
									expect.objectContaining({
										argumentPath: ["input", "organizationId"],
									}),
								]),
							}),
							path: ["deleteOrganizationMembership"],
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when the client is authorized", () => {
		test(
			"should allow system administrator to delete membership",
			async () => {
				const orgId = await createTestOrganization(authToken);
				const { userId: targetUserId } = await createRegularUserUsingAdmin();
				await createTestMembership(authToken, orgId, targetUserId);

				const result = await mercuriusClient.mutate(
					Mutation_deleteOrganizationMembership,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								memberId: targetUserId,
								organizationId: orgId,
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.deleteOrganizationMembership).toEqual(
					expect.objectContaining({
						id: orgId,
					}),
				);
			},
			SUITE_TIMEOUT,
		);

		test(
			"should allow organization administrator to delete membership",
			async () => {
				const orgId = await createTestOrganization(authToken);

				// Create org admin
				const { authToken: orgAdminToken, userId: orgAdminId } =
					await createRegularUserUsingAdmin();
				assertToBeNonNullish(orgAdminToken);
				await createTestMembership(
					authToken,
					orgId,
					orgAdminId,
					"administrator",
				);

				// Create target user
				const { userId: targetUserId } = await createRegularUserUsingAdmin();
				await createTestMembership(authToken, orgId, targetUserId, "regular");

				const result = await mercuriusClient.mutate(
					Mutation_deleteOrganizationMembership,
					{
						headers: { authorization: `bearer ${orgAdminToken}` },
						variables: {
							input: {
								memberId: targetUserId,
								organizationId: orgId,
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.deleteOrganizationMembership).toEqual(
					expect.objectContaining({
						id: orgId,
					}),
				);
			},
			SUITE_TIMEOUT,
		);

		test(
			"should allow member to delete their own membership",
			async () => {
				const orgId = await createTestOrganization(authToken);

				// Create regular user and add as member
				const { authToken: memberToken, userId: memberId } =
					await createRegularUserUsingAdmin();
				assertToBeNonNullish(memberToken);
				await createTestMembership(authToken, orgId, memberId, "regular");

				const result = await mercuriusClient.mutate(
					Mutation_deleteOrganizationMembership,
					{
						headers: { authorization: `bearer ${memberToken}` },
						variables: {
							input: {
								memberId: memberId,
								organizationId: orgId,
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.deleteOrganizationMembership).toEqual(
					expect.objectContaining({
						id: orgId,
					}),
				);
			},
			SUITE_TIMEOUT,
		);
	});

	suite(
		"when the deletion returns no deleted membership (race condition)",
		() => {
			test(
				"should return an error with unexpected extensions code",
				async () => {
					const orgId = await createTestOrganization(authToken);
					const { userId: targetUserId } = await createRegularUserUsingAdmin();
					await createTestMembership(authToken, orgId, targetUserId);

					// Mock the delete operation to return empty result
					const originalDelete = server.drizzleClient.delete;
					const fakeDelete = () => ({
						where: () => ({
							returning: async () => [],
						}),
					});

					try {
						server.drizzleClient.delete =
							fakeDelete as unknown as typeof server.drizzleClient.delete;

						const result = await mercuriusClient.mutate(
							Mutation_deleteOrganizationMembership,
							{
								headers: { authorization: `bearer ${authToken}` },
								variables: {
									input: {
										memberId: targetUserId,
										organizationId: orgId,
									},
								},
							},
						);

						expect(
							result.data?.deleteOrganizationMembership ?? null,
						).toBeNull();
						expect(result.errors).toEqual(
							expect.arrayContaining([
								expect.objectContaining({
									extensions: expect.objectContaining({
										code: "unexpected",
									}),
									path: ["deleteOrganizationMembership"],
								}),
							]),
						);
					} finally {
						server.drizzleClient.delete = originalDelete;
					}
				},
				SUITE_TIMEOUT,
			);
		},
	);
});
