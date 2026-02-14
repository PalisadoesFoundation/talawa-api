import { faker } from "@faker-js/faker";
import { gql } from "graphql-tag";
import { expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { Mutation_createAdvertisement } from "../../../routes/graphql/documentNodes";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_deleteCurrentUser,
	Query_signIn,
} from "../documentNodes";

const signInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});

const Mutation_updateAdvertisement = gql`
  mutation Mutation_updateAdvertisement($input: MutationUpdateAdvertisementInput!) {
    updateAdvertisement(input: $input) {
      id
      name
      description
      type
      startAt
      endAt
    }
  }
`;

assertToBeNonNullish(signInResult.data?.signIn);
const authToken = signInResult.data.signIn.authenticationToken;
assertToBeNonNullish(authToken);

suite("Mutation field updateAdvertisement", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_updateAdvertisement,
				{
					variables: {
						input: {
							id: faker.string.uuid(),
							name: "Updated Ad Name",
						},
					},
				},
			);

			expect(result.data?.updateAdvertisement).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["updateAdvertisement"],
					}),
				]),
			);
		});
	});

	suite("when arguments are invalid (parse error)", () => {
		test("should return an error with invalid_arguments extension code", async () => {
			const invalidAdvertisementId = "not-a-valid-uuid";

			const result = await mercuriusClient.mutate(
				Mutation_updateAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: invalidAdvertisementId,
							name: "Test Update",
						},
					},
				},
			);

			expect(result.data?.updateAdvertisement ?? null).toBeNull();
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
						path: ["updateAdvertisement"],
					}),
				]),
			);
		});
	});

	suite("when the current user does not exist", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const { authToken: userToken } = await import(
				"../createRegularUserUsingAdmin"
			).then((module) => module.createRegularUserUsingAdmin());
			assertToBeNonNullish(userToken);

			// Delete the user
			await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
				headers: { authorization: `bearer ${userToken}` },
			});

			// Create org and advertisement using admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							description: faker.lorem.sentence(),
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: faker.location.streetAddress(),
						},
					},
				},
			);

			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const createAdResult = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							organizationId: orgId,
							type: "banner",
							startAt: new Date().toISOString(),
							endAt: new Date(Date.now() + 86400000).toISOString(),
						},
					},
				},
			);

			const adId = createAdResult.data?.createAdvertisement?.id;
			assertToBeNonNullish(adId);

			// Try to update with deleted user's token
			const result = await mercuriusClient.mutate(
				Mutation_updateAdvertisement,
				{
					headers: { authorization: `bearer ${userToken}` },
					variables: {
						input: {
							id: adId,
							name: "Updated Name",
						},
					},
				},
			);

			expect(result.data?.updateAdvertisement ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["updateAdvertisement"],
					}),
				]),
			);
		});
	});

	suite("when the advertisement does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found extensions code", async () => {
			const nonExistentAdId = faker.string.uuid();

			const result = await mercuriusClient.mutate(
				Mutation_updateAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: nonExistentAdId,
							name: "Updated Name",
						},
					},
				},
			);

			expect(result.data?.updateAdvertisement).toBeNull();
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
						path: ["updateAdvertisement"],
					}),
				]),
			);
		});
	});

	suite("when startAt validation fails", () => {
		test("should return an error when new startAt is after existing endAt", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							description: faker.lorem.sentence(),
							countryCode: "us",
							state: "CA",
							city: "Los Angeles",
							postalCode: "90001",
							addressLine1: faker.location.streetAddress(),
						},
					},
				},
			);

			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const startDate = new Date();
			const endDate = new Date(Date.now() + 86400000); // 1 day later

			const createAdResult = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							organizationId: orgId,
							type: "banner",
							startAt: startDate.toISOString(),
							endAt: endDate.toISOString(),
						},
					},
				},
			);

			const adId = createAdResult.data?.createAdvertisement?.id;
			assertToBeNonNullish(adId);

			// Try to update startAt to be after endAt
			const invalidStartAt = new Date(Date.now() + 172800000); // 2 days later

			const result = await mercuriusClient.mutate(
				Mutation_updateAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: adId,
							startAt: invalidStartAt.toISOString(),
						},
					},
				},
			);

			expect(result.data?.updateAdvertisement).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "startAt"],
								}),
							]),
						}),
						path: ["updateAdvertisement"],
					}),
				]),
			);
		});
	});

	suite("when endAt validation fails", () => {
		test("should return an error when new endAt is before existing startAt", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							description: faker.lorem.sentence(),
							countryCode: "us",
							state: "CA",
							city: "San Diego",
							postalCode: "92101",
							addressLine1: faker.location.streetAddress(),
						},
					},
				},
			);

			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const startDate = new Date(Date.now() + 86400000); // 1 day from now
			const endDate = new Date(Date.now() + 172800000); // 2 days from now

			const createAdResult = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							organizationId: orgId,
							type: "pop_up",
							startAt: startDate.toISOString(),
							endAt: endDate.toISOString(),
						},
					},
				},
			);

			const adId = createAdResult.data?.createAdvertisement?.id;
			assertToBeNonNullish(adId);

			// Try to update endAt to be before startAt
			const invalidEndAt = new Date(); // Current time (before startAt)

			const result = await mercuriusClient.mutate(
				Mutation_updateAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: adId,
							endAt: invalidEndAt.toISOString(),
						},
					},
				},
			);

			expect(result.data?.updateAdvertisement).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "endAt"],
								}),
							]),
						}),
						path: ["updateAdvertisement"],
					}),
				]),
			);
		});
	});

	suite("when updating advertisement name", () => {
		test("should return an error if name already exists in the same organization", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							description: faker.lorem.sentence(),
							countryCode: "us",
							state: "NY",
							city: "New York",
							postalCode: "10001",
							addressLine1: faker.location.streetAddress(),
						},
					},
				},
			);

			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const duplicateName = `Advertisement-${faker.string.uuid()}`;

			// Create first advertisement with the name
			await mercuriusClient.mutate(Mutation_createAdvertisement, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: duplicateName,
						organizationId: orgId,
						type: "banner",
						startAt: new Date().toISOString(),
						endAt: new Date(Date.now() + 86400000).toISOString(),
					},
				},
			});

			// Create second advertisement with a different name
			const createAdResult2 = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							organizationId: orgId,
							type: "pop_up",
							startAt: new Date().toISOString(),
							endAt: new Date(Date.now() + 86400000).toISOString(),
						},
					},
				},
			);

			const adId2 = createAdResult2.data?.createAdvertisement?.id;
			assertToBeNonNullish(adId2);

			// Try to update second advertisement with duplicate name
			const result = await mercuriusClient.mutate(
				Mutation_updateAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: adId2,
							name: duplicateName,
						},
					},
				},
			);

			expect(result.data?.updateAdvertisement).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "forbidden_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "name"],
									message: "This name is not available.",
								}),
							]),
						}),
						path: ["updateAdvertisement"],
					}),
				]),
			);
		});

		test("should allow updating advertisement with its current name", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							description: faker.lorem.sentence(),
							countryCode: "us",
							state: "MA",
							city: "Boston",
							postalCode: "02101",
							addressLine1: faker.location.streetAddress(),
						},
					},
				},
			);

			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const originalName = `Original-${faker.string.uuid()}`;
			const createAdResult = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: originalName,
							organizationId: orgId,
							type: "banner",
							startAt: new Date().toISOString(),
							endAt: new Date(Date.now() + 86400000).toISOString(),
						},
					},
				},
			);

			const adId = createAdResult.data?.createAdvertisement?.id;
			assertToBeNonNullish(adId);

			// Update with same name but different description
			const result = await mercuriusClient.mutate(
				Mutation_updateAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: adId,
							name: originalName, // Same name
							description: "Updated description",
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateAdvertisement).toEqual(
				expect.objectContaining({
					id: adId,
					name: originalName,
					description: "Updated description",
				}),
			);
		});
	});

	suite("when the user is not authorized", () => {
		test("should return an error when non-admin organization member tries to update advertisement", async () => {
			const { authToken: memberToken, userId } = await import(
				"../createRegularUserUsingAdmin"
			).then((module) => module.createRegularUserUsingAdmin());
			assertToBeNonNullish(memberToken);
			assertToBeNonNullish(userId);

			// Create organization as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							description: faker.lorem.sentence(),
							countryCode: "us",
							state: "CA",
							city: "Fresno",
							postalCode: "93701",
							addressLine1: faker.location.streetAddress(),
						},
					},
				},
			);

			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			// Add regular user as NON-ADMIN member to the organization
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: userId,
						role: "regular",
					},
				},
			});

			// Create advertisement as admin
			const createAdResult = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							organizationId: orgId,
							type: "banner",
							startAt: new Date().toISOString(),
							endAt: new Date(Date.now() + 86400000).toISOString(),
						},
					},
				},
			);

			const adId = createAdResult.data?.createAdvertisement?.id;
			assertToBeNonNullish(adId);

			// Try to update as non-admin organization member
			const result = await mercuriusClient.mutate(
				Mutation_updateAdvertisement,
				{
					headers: { authorization: `bearer ${memberToken}` },
					variables: {
						input: {
							id: adId,
							name: "Unauthorized Member Update",
						},
					},
				},
			);

			expect(result.data?.updateAdvertisement).toBeNull();
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
						path: ["updateAdvertisement"],
					}),
				]),
			);
		});

		test("should return an error when regular user with no organization membership tries to update advertisement", async () => {
			const { authToken: regularAuthToken } = await import(
				"../createRegularUserUsingAdmin"
			).then((module) => module.createRegularUserUsingAdmin());
			assertToBeNonNullish(regularAuthToken);

			// Create organization and advertisement as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							description: faker.lorem.sentence(),
							countryCode: "us",
							state: "CA",
							city: "Sacramento",
							postalCode: "95814",
							addressLine1: faker.location.streetAddress(),
						},
					},
				},
			);

			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const createAdResult = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							organizationId: orgId,
							type: "banner",
							startAt: new Date().toISOString(),
							endAt: new Date(Date.now() + 86400000).toISOString(),
						},
					},
				},
			);

			const adId = createAdResult.data?.createAdvertisement?.id;
			assertToBeNonNullish(adId);

			// Try to update as regular user (non-administrator)
			const result = await mercuriusClient.mutate(
				Mutation_updateAdvertisement,
				{
					headers: { authorization: `bearer ${regularAuthToken}` },
					variables: {
						input: {
							id: adId,
							name: "Unauthorized Update Attempt",
						},
					},
				},
			);

			expect(result.data?.updateAdvertisement).toBeNull();
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
						path: ["updateAdvertisement"],
					}),
				]),
			);
		});
	});

	suite("when the database update operation unexpectedly fails", () => {
		test("should return an error with unexpected extensions code", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							description: faker.lorem.sentence(),
							countryCode: "us",
							state: "CA",
							city: "Oakland",
							postalCode: "94601",
							addressLine1: faker.location.streetAddress(),
						},
					},
				},
			);

			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const createAdResult = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							organizationId: orgId,
							type: "banner",
							startAt: new Date().toISOString(),
							endAt: new Date(Date.now() + 86400000).toISOString(),
						},
					},
				},
			);

			const adId = createAdResult.data?.createAdvertisement?.id;
			assertToBeNonNullish(adId);

			// Use vi.spyOn for safer mocking
			const updateSpy = vi
				.spyOn(server.drizzleClient, "update")
				.mockReturnValueOnce({
					set: () => ({
						where: () => ({
							returning: async () => [],
						}),
					}),
				} as unknown as ReturnType<typeof server.drizzleClient.update>);

			try {
				const result = await mercuriusClient.mutate(
					Mutation_updateAdvertisement,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								id: adId,
								name: "Should Fail Update",
							},
						},
					},
				);

				expect(result.data?.updateAdvertisement).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unexpected",
							}),
							path: ["updateAdvertisement"],
						}),
					]),
				);
			} finally {
				updateSpy.mockRestore();
			}
		});
	});

	suite("when the update is successful", () => {
		test("should update advertisement name and return updated data", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							description: faker.lorem.sentence(),
							countryCode: "us",
							state: "CA",
							city: "San Jose",
							postalCode: "95101",
							addressLine1: faker.location.streetAddress(),
						},
					},
				},
			);

			expect(createOrgResult.errors).toBeUndefined();
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(
				orgId,
				`createOrganization did not return an id. Errors: ${JSON.stringify(createOrgResult.errors ?? [])}. Data: ${JSON.stringify(createOrgResult.data ?? null)}`,
			);

			const originalName = `Original-${faker.string.uuid()}`;
			const createAdResult = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: originalName,
							organizationId: orgId,
							type: "banner",
							startAt: new Date().toISOString(),
							endAt: new Date(Date.now() + 86400000).toISOString(),
						},
					},
				},
			);

			expect(createAdResult.errors).toBeUndefined();
			const adId = createAdResult.data?.createAdvertisement?.id;
			assertToBeNonNullish(
				adId,
				`createAdvertisement did not return an id. Errors: ${JSON.stringify(createAdResult.errors ?? [])}. Data: ${JSON.stringify(createAdResult.data ?? null)}`,
			);

			const updatedName = `Updated-${faker.string.uuid()}`;
			const result = await mercuriusClient.mutate(
				Mutation_updateAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: adId,
							name: updatedName,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateAdvertisement).toEqual(
				expect.objectContaining({
					id: adId,
					name: updatedName,
				}),
			);
		});

		test("should update advertisement description", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							description: faker.lorem.sentence(),
							countryCode: "us",
							state: "TX",
							city: "Austin",
							postalCode: "73301",
							addressLine1: faker.location.streetAddress(),
						},
					},
				},
			);

			expect(createOrgResult.errors).toBeUndefined();
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(
				orgId,
				`createOrganization returned no id. Response: ${JSON.stringify(createOrgResult.data)}`,
			);

			const createAdResult = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							organizationId: orgId,
							type: "banner",
							startAt: new Date().toISOString(),
							endAt: new Date(Date.now() + 86400000).toISOString(),
						},
					},
				},
			);

			expect(createAdResult.errors).toBeUndefined();
			const adId = createAdResult.data?.createAdvertisement?.id;
			assertToBeNonNullish(
				adId,
				`createAdvertisement returned no id. Response: ${JSON.stringify(createAdResult.data)}`,
			);

			const updatedDescription = faker.lorem.paragraph();
			const result = await mercuriusClient.mutate(
				Mutation_updateAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: adId,
							description: updatedDescription,
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateAdvertisement).toEqual(
				expect.objectContaining({
					id: adId,
					description: updatedDescription,
				}),
			);
		});

		test("should update advertisement type", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							description: faker.lorem.sentence(),
							countryCode: "us",
							state: "FL",
							city: "Miami",
							postalCode: "33101",
							addressLine1: faker.location.streetAddress(),
						},
					},
				},
			);

			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const createAdResult = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							organizationId: orgId,
							type: "banner",
							startAt: new Date().toISOString(),
							endAt: new Date(Date.now() + 86400000).toISOString(),
						},
					},
				},
			);

			const adId = createAdResult.data?.createAdvertisement?.id;
			assertToBeNonNullish(adId);

			const result = await mercuriusClient.mutate(
				Mutation_updateAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: adId,
							type: "pop_up",
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateAdvertisement).toEqual(
				expect.objectContaining({
					id: adId,
					type: "pop_up",
				}),
			);
		});

		test("should update both startAt and endAt successfully", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							description: faker.lorem.sentence(),
							countryCode: "us",
							state: "WA",
							city: "Seattle",
							postalCode: "98101",
							addressLine1: faker.location.streetAddress(),
						},
					},
				},
			);

			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const createAdResult = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							organizationId: orgId,
							type: "banner",
							startAt: new Date().toISOString(),
							endAt: new Date(Date.now() + 86400000).toISOString(),
						},
					},
				},
			);

			const adId = createAdResult.data?.createAdvertisement?.id;
			assertToBeNonNullish(adId);

			const newStartAt = new Date(Date.now() + 3600000); // 1 hour from now
			const newEndAt = new Date(Date.now() + 259200000); // 3 days from now

			const result = await mercuriusClient.mutate(
				Mutation_updateAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: adId,
							startAt: newStartAt.toISOString(),
							endAt: newEndAt.toISOString(),
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateAdvertisement).toEqual(
				expect.objectContaining({
					id: adId,
					startAt: newStartAt.toISOString(),
					endAt: newEndAt.toISOString(),
				}),
			);
		});

		test("should update multiple fields at once", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							description: faker.lorem.sentence(),
							countryCode: "us",
							state: "IL",
							city: "Chicago",
							postalCode: "60601",
							addressLine1: faker.location.streetAddress(),
						},
					},
				},
			);

			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const createAdResult = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							organizationId: orgId,
							type: "banner",
							startAt: new Date().toISOString(),
							endAt: new Date(Date.now() + 86400000).toISOString(),
						},
					},
				},
			);

			const adId = createAdResult.data?.createAdvertisement?.id;
			assertToBeNonNullish(adId);

			const updatedName = `MultiUpdate-${faker.string.uuid()}`;
			const updatedDescription = faker.lorem.paragraph();

			const result = await mercuriusClient.mutate(
				Mutation_updateAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: adId,
							name: updatedName,
							description: updatedDescription,
							type: "pop_up",
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateAdvertisement).toEqual(
				expect.objectContaining({
					id: adId,
					name: updatedName,
					description: updatedDescription,
					type: "pop_up",
				}),
			);
		});
	});
});
