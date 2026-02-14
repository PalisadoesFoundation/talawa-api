import { faker } from "@faker-js/faker";
import { gql } from "graphql-tag";
import { expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_deleteCurrentUser,
	Mutation_joinPublicOrganization,
	Query_signIn,
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

// Constants
const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 86400000 milliseconds
const ONE_WEEK_MS = 7 * ONE_DAY_MS;

// Helper function to create test organization
async function createTestOrganization(token: string) {
	const result = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${token}` },
		variables: {
			input: {
				name: `${faker.company.name()}-${faker.string.ulid()}`,
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

suite("Mutation field createAdvertisement", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					variables: {
						input: {
							name: "Test Advertisement",
							description: "Test Description",
							organizationId: faker.string.uuid(),
							type: "banner",
							startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes in the future
							endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
						},
					},
				},
			);

			expect(result.data?.createAdvertisement).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["createAdvertisement"],
					}),
				]),
			);
		});
	});

	suite("when arguments are invalid", () => {
		test("should return an error with invalid_arguments extension code for invalid organizationId", async () => {
			const invalidOrganizationId = "not-a-valid-uuid";

			const result = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Test Ad",
							description: "Test Description",
							organizationId: invalidOrganizationId,
							type: "banner",
							startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes in the future
							endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
						},
					},
				},
			);

			expect(result.data?.createAdvertisement).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "organizationId"],
								}),
							]),
						}),
						path: ["createAdvertisement"],
					}),
				]),
			);
		});

		test("should return an error for empty name", async () => {
			const orgId = await createTestOrganization(authToken);

			const result = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "",
							description: "Test Description",
							organizationId: orgId,
							type: "banner",
							startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes in the future
							endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
						},
					},
				},
			);

			expect(result.data?.createAdvertisement).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
						path: ["createAdvertisement"],
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

			await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
				headers: { authorization: `bearer ${userToken}` },
			});

			const orgId = await createTestOrganization(authToken);

			const result = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${userToken}` },
					variables: {
						input: {
							name: "Test Ad",
							description: "Test Description",
							organizationId: orgId,
							type: "banner",
							startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes in the future
							endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
						},
					},
				},
			);

			expect(result.data?.createAdvertisement).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["createAdvertisement"],
					}),
				]),
			);
		});
	});

	suite("when the specified organization does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found extensions code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Test Ad",
							description: "Test Description",
							organizationId: faker.string.uuid(),
							type: "banner",
							startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes in the future
							endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
						},
					},
				},
			);

			expect(result.data?.createAdvertisement).toBeNull();
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
						path: ["createAdvertisement"],
					}),
				]),
			);
		});
	});

	suite("when the current user is not a member of the organization", () => {
		test("should return an error with unauthorized_action_on_arguments_associated_resources extensions code", async () => {
			const { authToken: regularAuthToken } = await import(
				"../createRegularUserUsingAdmin"
			).then((module) => module.createRegularUserUsingAdmin());
			assertToBeNonNullish(regularAuthToken);

			const orgId = await createTestOrganization(authToken);

			const result = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${regularAuthToken}` },
					variables: {
						input: {
							name: "Test Ad",
							description: "Test Description",
							organizationId: orgId,
							type: "banner",
							startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes in the future
							endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
						},
					},
				},
			);

			expect(result.data?.createAdvertisement).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "organizationId"],
								}),
							]),
						}),
						path: ["createAdvertisement"],
					}),
				]),
			);
		});
	});

	suite("when an advertisement with the same name already exists", () => {
		test("should return an error with forbidden_action_on_arguments_associated_resources extensions code", async () => {
			const orgId = await createTestOrganization(authToken);
			const adName = `Duplicate Ad ${faker.string.uuid()}`;

			const firstResult = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: adName,
							description: "First Ad",
							organizationId: orgId,
							type: "banner",
							startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes in the future
							endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
						},
					},
				},
			);

			expect(firstResult.errors).toBeUndefined();
			assertToBeNonNullish(firstResult.data?.createAdvertisement);

			const result = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: adName,
							description: "Duplicate Ad",
							organizationId: orgId,
							type: "banner",
							startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes in the future
							endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
						},
					},
				},
			);

			expect(result.data?.createAdvertisement).toBeNull();
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
						path: ["createAdvertisement"],
					}),
				]),
			);
		});
	});

	suite("when the client is not authorized", () => {
		test("should return an error with unauthorized_action_on_arguments_associated_resources when user is not admin and not org admin", async () => {
			const { authToken: regularAuthToken } = await import(
				"../createRegularUserUsingAdmin"
			).then((module) => module.createRegularUserUsingAdmin());
			assertToBeNonNullish(regularAuthToken);

			const orgId = await createTestOrganization(authToken);

			const joinResult = await mercuriusClient.mutate(
				Mutation_joinPublicOrganization,
				{
					headers: { authorization: `bearer ${regularAuthToken}` },
					variables: {
						input: {
							organizationId: orgId,
						},
					},
				},
			);

			expect(joinResult.data?.joinPublicOrganization).toBeDefined();

			const result = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${regularAuthToken}` },
					variables: {
						input: {
							name: "Unauthorized Ad",
							description: "Test Description",
							organizationId: orgId,
							type: "banner",
							startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes in the future
							endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
						},
					},
				},
			);

			expect(result.data?.createAdvertisement).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "organizationId"],
								}),
							]),
						}),
						path: ["createAdvertisement"],
					}),
				]),
			);
		});

		test("should allow system administrator to create advertisement without being org member", async () => {
			const { authToken: regularUserToken } = await import(
				"../createRegularUserUsingAdmin"
			).then((module) => module.createRegularUserUsingAdmin());
			assertToBeNonNullish(regularUserToken);

			// Admin creates org for regular user
			const orgId = await createTestOrganization(authToken);

			const result = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `System Admin Ad ${faker.string.uuid()}`,
							description: "Created by system administrator",
							organizationId: orgId,
							type: "banner",
							startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes in the future
							endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.createAdvertisement).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					description: "Created by system administrator",
					organization: expect.objectContaining({
						id: orgId,
					}),
				}),
			);
		});
	});

	suite("when the database insert operation unexpectedly fails", () => {
		test("should return an error with unexpected extensions code", async () => {
			const orgId = await createTestOrganization(authToken);

			const originalTransaction = server.drizzleClient.transaction;
			server.drizzleClient.transaction = vi
				.fn()
				.mockImplementation(async (callback) => {
					const mockTx = {
						insert: () => ({
							values: () => ({
								returning: async () => [],
							}),
						}),
					};
					return await callback(mockTx);
				});

			try {
				const result = await mercuriusClient.mutate(
					Mutation_createAdvertisement,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								name: `Failed Ad ${faker.string.uuid()}`,
								description: "Should fail",
								organizationId: orgId,
								type: "banner",
								startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes in the future
								endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
							},
						},
					},
				);

				expect(result.data?.createAdvertisement).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unexpected",
							}),
							path: ["createAdvertisement"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.transaction = originalTransaction;
			}
		});
	});

	suite("when creating advertisement successfully", () => {
		test("should create advertisement without attachments", async () => {
			const orgId = await createTestOrganization(authToken);
			const startDate = new Date(Date.now() + 5 * 60 * 1000);
			const endDate = new Date(Date.now() + ONE_WEEK_MS);

			const result = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Ad No Attachments ${faker.string.uuid()}`,
							description: "Advertisement without attachments",
							organizationId: orgId,
							type: "pop_up",
							startAt: startDate.toISOString(),
							endAt: endDate.toISOString(),
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.createAdvertisement).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					name: expect.stringContaining("Ad No Attachments"),
					description: "Advertisement without attachments",
					type: "pop_up",
					attachments: [],
					organization: expect.objectContaining({
						id: orgId,
					}),
				}),
			);
		});
	});

	suite("edge cases and validation", () => {
		test("should handle long description text", async () => {
			const orgId = await createTestOrganization(authToken);
			const longDescription = faker.lorem.paragraphs(5);

			const result = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Ad Long Desc ${faker.string.uuid()}`,
							description: longDescription,
							organizationId: orgId,
							type: "banner",
							startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes in the future
							endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.createAdvertisement).toEqual(
				expect.objectContaining({
					description: longDescription,
				}),
			);
		});

		test("should handle different advertisement types", async () => {
			const orgId = await createTestOrganization(authToken);
			const adTypes: ("banner" | "menu" | "pop_up")[] = [
				"banner",
				"menu",
				"pop_up",
			];

			for (const adType of adTypes) {
				const result = await mercuriusClient.mutate(
					Mutation_createAdvertisement,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								name: `Ad Type ${adType} ${faker.string.uuid()}`,
								description: `Testing type ${adType}`,
								organizationId: orgId,
								type: adType,
								startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes in the future
								endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.createAdvertisement).toEqual(
					expect.objectContaining({
						type: adType,
					}),
				);
			}
		});
	});

	suite("security checks", () => {
		test("should handle special characters in advertisement name", async () => {
			const orgId = await createTestOrganization(authToken);
			const specialName = `Ad with "quotes" & <brackets> ${faker.string.uuid()}`;

			const result = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: specialName,
							description: "Testing special characters",
							organizationId: orgId,
							type: "banner",
							startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes in the future
							endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			const advertisement = result.data?.createAdvertisement;
			assertToBeNonNullish(advertisement);

			// Server HTML-encodes special characters for security
			expect(advertisement.id).toBeDefined();
			expect(advertisement.name).toMatch(/Ad with.*quotes.*brackets/);
		});

		test("should handle very long description", async () => {
			const orgId = await createTestOrganization(authToken);
			const longDescription = faker.lorem.paragraphs(10);

			const result = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Long Desc Ad ${faker.string.uuid()}`,
							description: longDescription,
							organizationId: orgId,
							type: "menu",
							startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes in the future
							endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
						},
					},
				},
			);

			// Description field has no max length constraint, expect success
			expect(result.errors).toBeUndefined();
			expect(result.data?.createAdvertisement).toBeDefined();
			expect(result.data?.createAdvertisement?.description).toBe(
				longDescription,
			);
		});

		test("should validate date range - endAt must be after startAt", async () => {
			const orgId = await createTestOrganization(authToken);
			const startDate = new Date(Date.now() + 5 * 60 * 1000);
			const endDate = new Date(Date.now() - ONE_DAY_MS);

			const result = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Invalid Date Ad ${faker.string.uuid()}`,
							description: "End date before start date",
							organizationId: orgId,
							type: "banner",
							startAt: startDate.toISOString(),
							endAt: endDate.toISOString(),
						},
					},
				},
			);

			expect(result.data?.createAdvertisement).toBeNull();
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
						path: ["createAdvertisement"],
					}),
				]),
			);
		});
	});

	suite("when creating advertisement with attachments", () => {
		test("should return invalid_arguments when attachment file not found in MinIO", async () => {
			const orgId = await createTestOrganization(authToken);
			const objectName = `non-existent-${faker.string.uuid()}`;

			// Mock statObject to throw NotFound error
			const statObjectSpy = vi
				.spyOn(server.minio.client, "statObject")
				.mockRejectedValue(
					Object.assign(new Error("Not Found"), { code: "NotFound" }),
				);

			try {
				const result = await mercuriusClient.mutate(
					Mutation_createAdvertisement,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								name: `Ad With Attachment ${faker.string.uuid()}`,
								description: "Test ad with attachment",
								organizationId: orgId,
								type: "banner",
								startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
								endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
								attachments: [
									{
										objectName: objectName,
										mimeType: "IMAGE_JPEG",
										fileHash: "a".repeat(64),
										name: "test.jpg",
									},
								],
							},
						},
					},
				);

				expect(result.data?.createAdvertisement).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "invalid_arguments",
							}),
							path: ["createAdvertisement"],
						}),
					]),
				);
				expect(statObjectSpy).toHaveBeenCalled();
			} finally {
				statObjectSpy.mockRestore();
			}
		});

		test("should return unexpected error when statObject fails with non-NotFound error", async () => {
			const orgId = await createTestOrganization(authToken);
			const objectName = `some-file-${faker.string.uuid()}`;

			// Mock statObject to throw a non-NotFound error (e.g., network error)
			const statObjectSpy = vi
				.spyOn(server.minio.client, "statObject")
				.mockRejectedValue(new Error("Network connection failed"));

			try {
				const result = await mercuriusClient.mutate(
					Mutation_createAdvertisement,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								name: `Ad With Attachment ${faker.string.uuid()}`,
								description: "Test ad with attachment",
								organizationId: orgId,
								type: "banner",
								startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
								endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
								attachments: [
									{
										objectName: objectName,
										mimeType: "IMAGE_PNG",
										fileHash: "a".repeat(64),
										name: "test.png",
									},
								],
							},
						},
					},
				);

				expect(result.data?.createAdvertisement).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unexpected",
							}),
							path: ["createAdvertisement"],
						}),
					]),
				);
				expect(statObjectSpy).toHaveBeenCalled();
			} finally {
				statObjectSpy.mockRestore();
			}
		});

		test("should successfully create advertisement with attachments", async () => {
			const orgId = await createTestOrganization(authToken);

			// Put a file in MinIO first
			const objectName = `attachments/${faker.string.uuid()}.jpg`;
			const fileContent = Buffer.from("fake image content");
			await server.minio.client.putObject(
				server.minio.bucketName,
				objectName,
				fileContent,
				fileContent.length,
				{ "content-type": "image/jpeg" },
			);

			try {
				const result = await mercuriusClient.mutate(
					Mutation_createAdvertisement,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								name: `Ad With Attachment ${faker.string.uuid()}`,
								description: "Test ad with attachment",
								organizationId: orgId,
								type: "banner",
								startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
								endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
								attachments: [
									{
										objectName: objectName,
										mimeType: "IMAGE_JPEG",
										fileHash: "a".repeat(64),
										name: "uploaded-image.jpg",
									},
								],
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.createAdvertisement).toBeDefined();
				expect(result.data?.createAdvertisement?.attachments).toHaveLength(1);
			} finally {
				// Cleanup: remove uploaded MinIO object
				try {
					await server.minio.client.removeObject(
						server.minio.bucketName,
						objectName,
					);
				} catch {
					// Intentional: cleanup errors are non-critical and should not fail the test
					console.debug("MinIO cleanup failed, ignoring");
				}
			}
		});
	});
});
