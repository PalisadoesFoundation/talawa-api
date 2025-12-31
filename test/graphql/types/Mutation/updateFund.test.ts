import { faker } from "@faker-js/faker";
import { expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createFund,
	Mutation_createOrganization,
	Mutation_deleteCurrentUser,
	Mutation_updateFund,
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
assertToBeNonNullish(signInResult.data?.signIn);
const authToken = signInResult.data.signIn.authenticationToken;
assertToBeNonNullish(authToken);

suite("Mutation field updateFund", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_updateFund, {
				variables: {
					input: {
						id: faker.string.uuid(),
						name: "Updated Fund",
					},
				},
			});

			expect(result.data?.updateFund).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["updateFund"],
					}),
				]),
			);
		});
	});

	suite("when arguments are invalid (parse error)", () => {
		test("should return an error with invalid_arguments extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_updateFund, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: "invalid-id-format",
						name: "Test",
					},
				},
			});

			expect(result.data?.updateFund).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
						path: ["updateFund"],
					}),
				]),
			);
		});
	});

	suite("when the specified fund does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found extensions code", async () => {
			const nonExistentFundId = faker.string.uuid();

			const result = await mercuriusClient.mutate(Mutation_updateFund, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: nonExistentFundId,
						name: "Updated Fund",
					},
				},
			});

			expect(result.data?.updateFund).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["updateFund"],
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

			// Create organization and fund as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Org ${faker.string.uuid()}`,
							countryCode: "us",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
						},
					},
				},
			);
			const fundId = createFundResult.data?.createFund?.id;
			assertToBeNonNullish(fundId);

			// Delete the user
			await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
				headers: { authorization: `bearer ${userToken}` },
			});

			const result = await mercuriusClient.mutate(Mutation_updateFund, {
				headers: { authorization: `bearer ${userToken}` },
				variables: {
					input: {
						id: fundId,
						name: "Updated Fund",
					},
				},
			});

			expect(result.data?.updateFund).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["updateFund"],
					}),
				]),
			);
		});
	});

	suite("when the user is not authorized to update the fund", () => {
		test("should return an error with unauthorized_action_on_arguments_associated_resources extensions code", async () => {
			const { authToken: regularAuthToken } = await import(
				"../createRegularUserUsingAdmin"
			).then((module) => module.createRegularUserUsingAdmin());
			assertToBeNonNullish(regularAuthToken);

			// Create organization and fund as admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Org ${faker.string.uuid()}`,
							countryCode: "us",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
						},
					},
				},
			);
			const fundId = createFundResult.data?.createFund?.id;
			assertToBeNonNullish(fundId);

			// Try to update as regular user
			const result = await mercuriusClient.mutate(Mutation_updateFund, {
				headers: { authorization: `bearer ${regularAuthToken}` },
				variables: {
					input: {
						id: fundId,
						name: "Updated Fund",
					},
				},
			});

			expect(result.data?.updateFund).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
						path: ["updateFund"],
					}),
				]),
			);
		});
	});

	suite(
		"when a fund with the same name already exists in the organization",
		() => {
			test("should return an error with forbidden_action_on_arguments_associated_resources extensions code", async () => {
				// Create organization
				const createOrgResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								name: `Org ${faker.string.uuid()}`,
								countryCode: "us",
							},
						},
					},
				);
				const orgId = createOrgResult.data?.createOrganization?.id;
				assertToBeNonNullish(orgId);

				// Create first fund
				const existingFundName = `Existing Fund ${faker.string.uuid()}`;
				await mercuriusClient.mutate(Mutation_createFund, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: existingFundName,
							organizationId: orgId,
							isTaxDeductible: false,
						},
					},
				});

				// Create second fund
				const createFund2Result = await mercuriusClient.mutate(
					Mutation_createFund,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								name: `Fund ${faker.string.uuid()}`,
								organizationId: orgId,
								isTaxDeductible: false,
							},
						},
					},
				);
				const fund2Id = createFund2Result.data?.createFund?.id;
				assertToBeNonNullish(fund2Id);

				// Try to update second fund with existing name
				const result = await mercuriusClient.mutate(Mutation_updateFund, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: fund2Id,
							name: existingFundName,
						},
					},
				});

				expect(result.data?.updateFund).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "forbidden_action_on_arguments_associated_resources",
							}),
							path: ["updateFund"],
						}),
					]),
				);
			});
		},
	);

	suite("when the database update operation unexpectedly fails", () => {
		test("should return an error with unexpected extensions code", async () => {
			// Create organization and fund
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Org ${faker.string.uuid()}`,
							countryCode: "us",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
						},
					},
				},
			);
			const fundId = createFundResult.data?.createFund?.id;
			assertToBeNonNullish(fundId);

			// Mock the update method to return empty array
			const originalUpdate = server.drizzleClient.update;

			try {
				server.drizzleClient.update = vi.fn().mockReturnValue({
					set: vi.fn().mockReturnThis(),
					where: vi.fn().mockReturnThis(),
					returning: vi.fn().mockResolvedValue([]),
				});

				const result = await mercuriusClient.mutate(Mutation_updateFund, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: fundId,
							name: "Updated Fund",
						},
					},
				});

				expect(result.data?.updateFund).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({ code: "unexpected" }),
							path: ["updateFund"],
						}),
					]),
				);
			} finally {
				// Restore original method
				server.drizzleClient.update = originalUpdate;
			}
		});
	});

	suite("when updating fund fields successfully", () => {
		test("should update isDefault from false to true", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Org ${faker.string.uuid()}`,
							countryCode: "us",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
							isDefault: false,
						},
					},
				},
			);
			const fundId = createFundResult.data?.createFund?.id;
			assertToBeNonNullish(fundId);

			const result = await mercuriusClient.mutate(Mutation_updateFund, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: fundId,
						isDefault: true,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateFund?.isDefault).toBe(true);
		});

		test("should update isDefault from true to false", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Org ${faker.string.uuid()}`,
							countryCode: "us",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
							isDefault: true,
						},
					},
				},
			);
			const fundId = createFundResult.data?.createFund?.id;
			assertToBeNonNullish(fundId);

			const result = await mercuriusClient.mutate(Mutation_updateFund, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: fundId,
						isDefault: false,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateFund?.isDefault).toBe(false);
		});

		test("should update isArchived to archive fund", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Org ${faker.string.uuid()}`,
							countryCode: "us",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
							isArchived: false,
						},
					},
				},
			);
			const fundId = createFundResult.data?.createFund?.id;
			assertToBeNonNullish(fundId);

			const result = await mercuriusClient.mutate(Mutation_updateFund, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: fundId,
						isArchived: true,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateFund?.isArchived).toBe(true);
		});

		test("should update isArchived to unarchive fund", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Org ${faker.string.uuid()}`,
							countryCode: "us",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
							isArchived: true,
						},
					},
				},
			);
			const fundId = createFundResult.data?.createFund?.id;
			assertToBeNonNullish(fundId);

			const result = await mercuriusClient.mutate(Mutation_updateFund, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: fundId,
						isArchived: false,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateFund?.isArchived).toBe(false);
		});

		test("should update referenceNumber to a new value", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Org ${faker.string.uuid()}`,
							countryCode: "us",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
							referenceNumber: "OLD-REF-123",
						},
					},
				},
			);
			const fundId = createFundResult.data?.createFund?.id;
			assertToBeNonNullish(fundId);

			const newReferenceNumber = `NEW-REF-${faker.string.alphanumeric(10)}`;
			const result = await mercuriusClient.mutate(Mutation_updateFund, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: fundId,
						referenceNumber: newReferenceNumber,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateFund?.referenceNumber).toBe(newReferenceNumber);
		});

		test("should set referenceNumber to null", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Org ${faker.string.uuid()}`,
							countryCode: "us",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
							referenceNumber: "INITIAL-REF-123",
						},
					},
				},
			);
			const fundId = createFundResult.data?.createFund?.id;
			assertToBeNonNullish(fundId);

			const result = await mercuriusClient.mutate(Mutation_updateFund, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: fundId,
						referenceNumber: null,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateFund?.referenceNumber).toBeNull();
		});

		test("should update multiple fields together", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Org ${faker.string.uuid()}`,
							countryCode: "us",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
							isDefault: false,
							isArchived: false,
							referenceNumber: "OLD-REF",
						},
					},
				},
			);
			const fundId = createFundResult.data?.createFund?.id;
			assertToBeNonNullish(fundId);

			const newReferenceNumber = `UPDATED-${faker.string.alphanumeric(8)}`;
			const result = await mercuriusClient.mutate(Mutation_updateFund, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: fundId,
						isDefault: true,
						isArchived: true,
						referenceNumber: newReferenceNumber,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateFund).toEqual(
				expect.objectContaining({
					id: fundId,
					isDefault: true,
					isArchived: true,
					referenceNumber: newReferenceNumber,
				}),
			);
		});

		test("should preserve other fields when updating specific fields", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Org ${faker.string.uuid()}`,
							countryCode: "us",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const initialReferenceNumber = "PRESERVED-REF";
			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
							isDefault: true,
							isArchived: false,
							referenceNumber: initialReferenceNumber,
						},
					},
				},
			);
			const fundId = createFundResult.data?.createFund?.id;
			assertToBeNonNullish(fundId);

			// Only update isArchived
			const result = await mercuriusClient.mutate(Mutation_updateFund, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: fundId,
						isArchived: true,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateFund).toEqual(
				expect.objectContaining({
					id: fundId,
					isDefault: true, // Should be preserved
					isArchived: true, // Updated
					referenceNumber: initialReferenceNumber, // Should be preserved
				}),
			);
		});

		test("should update name alongside new fields", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Org ${faker.string.uuid()}`,
							countryCode: "us",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
							isDefault: false,
						},
					},
				},
			);
			const fundId = createFundResult.data?.createFund?.id;
			assertToBeNonNullish(fundId);

			const newName = `Updated Fund ${faker.string.uuid()}`;
			const result = await mercuriusClient.mutate(Mutation_updateFund, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: fundId,
						name: newName,
						isDefault: true,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateFund).toEqual(
				expect.objectContaining({
					id: fundId,
					name: newName,
					isDefault: true,
				}),
			);
		});

		test("should update isTaxDeductible alongside new fields", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Org ${faker.string.uuid()}`,
							countryCode: "us",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const createFundResult = await mercuriusClient.mutate(
				Mutation_createFund,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Fund ${faker.string.uuid()}`,
							organizationId: orgId,
							isTaxDeductible: false,
							isArchived: false,
						},
					},
				},
			);
			const fundId = createFundResult.data?.createFund?.id;
			assertToBeNonNullish(fundId);

			const result = await mercuriusClient.mutate(Mutation_updateFund, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: fundId,
						isTaxDeductible: true,
						isArchived: true,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateFund).toEqual(
				expect.objectContaining({
					id: fundId,
					isTaxDeductible: true,
					isArchived: true,
				}),
			);
		});
	});
});
