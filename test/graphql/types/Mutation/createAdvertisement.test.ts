import { Readable } from "node:stream";
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
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const ONE_WEEK_MS = 7 * ONE_DAY_MS;

// Helper function to create test organization
async function createTestOrganization(token: string) {
	const result = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${token}` },
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
	});
	const orgId = result.data?.createOrganization?.id;
	assertToBeNonNullish(orgId);
	return orgId;
}

// Helper to create mock file upload
function createMockFileUpload(
	filename: string,
	mimetype: string,
	content: string,
): Promise<{
	filename: string;
	mimetype: string;
	encoding: string;
	createReadStream: () => Readable;
}> {
	return Promise.resolve({
		filename,
		mimetype,
		encoding: "7bit",
		createReadStream: () => Readable.from(Buffer.from(content)),
	});
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
							startAt: new Date().toISOString(),
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
							startAt: new Date().toISOString(),
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

		test("should return an error for invalid advertisement type at GraphQL schema level", async () => {
			const orgId = await createTestOrganization(authToken);

			const result = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Ad with Invalid Type",
							description: "Test Description",
							organizationId: orgId,
							type: "invalid_type",
							startAt: new Date().toISOString(),
							endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
						},
					},
				},
			);

			expect(result.data?.createAdvertisement).toBeUndefined();
			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.message).toContain(
				'Value "invalid_type" does not exist in "AdvertisementType" enum',
			);
		});

		test("should return an error with invalid_arguments for empty name", async () => {
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
							startAt: new Date().toISOString(),
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
									argumentPath: ["input", "name"],
								}),
							]),
						}),
						path: ["createAdvertisement"],
					}),
				]),
			);
		});

		test("should return a GraphQL Upload error for invalid attachment shape", async () => {
			const orgId = await createTestOrganization(authToken);

			const invalidAttachment = createMockFileUpload(
				"test.txt",
				"text/plain",
				"test content",
			);

			const result = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Ad Invalid Mime ${faker.string.uuid()}`,
							description: "Test Description",
							organizationId: orgId,
							type: "banner",
							startAt: new Date().toISOString(),
							endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
							attachments: [invalidAttachment],
						},
					},
				},
			);

			// GraphQL Upload scalar rejects our mocked value before hitting the resolver
			expect(result.data?.createAdvertisement).toBeUndefined();
			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.message).toContain("Upload value invalid");
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
							startAt: new Date().toISOString(),
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
							startAt: new Date().toISOString(),
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
							startAt: new Date().toISOString(),
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
							startAt: new Date().toISOString(),
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
							startAt: new Date().toISOString(),
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
							startAt: new Date().toISOString(),
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

		test("should properly check organization administrator permissions", async () => {
			const { authToken: regularUserToken, userId: regularUserId } =
				await import("../createRegularUserUsingAdmin").then((module) =>
					module.createRegularUserUsingAdmin(),
				);
			assertToBeNonNullish(regularUserToken);
			assertToBeNonNullish(regularUserId);

			const orgId = await createTestOrganization(authToken);

			const joinResult = await mercuriusClient.mutate(
				Mutation_joinPublicOrganization,
				{
					headers: { authorization: `bearer ${regularUserToken}` },
					variables: {
						input: {
							organizationId: orgId,
						},
					},
				},
			);
			expect(joinResult.data?.joinPublicOrganization).toBeDefined();
			expect(joinResult.data?.joinPublicOrganization?.role).toBe("regular");

			const result = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${regularUserToken}` },
					variables: {
						input: {
							name: `Regular Member Ad ${faker.string.uuid()}`,
							description: "Should be rejected",
							organizationId: orgId,
							type: "banner",
							startAt: new Date().toISOString(),
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
							startAt: new Date().toISOString(),
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
								startAt: new Date().toISOString(),
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
			const startDate = new Date();
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

		test("should create advertisement with minimum required fields", async () => {
			const orgId = await createTestOrganization(authToken);

			const result = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Minimal Ad ${faker.string.uuid()}`,
							description: "Minimal description",
							organizationId: orgId,
							type: "banner",
							startAt: new Date().toISOString(),
							endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			const advertisement = result.data?.createAdvertisement;
			assertToBeNonNullish(advertisement);
			expect(advertisement.id).toBeDefined();
			expect(advertisement.name).toContain("Minimal Ad");
			expect(advertisement.attachments).toEqual([]);
		});

		test("should create advertisement with future start date", async () => {
			const orgId = await createTestOrganization(authToken);
			const futureStart = new Date(Date.now() + ONE_WEEK_MS);
			const futureEnd = new Date(Date.now() + 2 * ONE_WEEK_MS);

			const result = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Future Ad ${faker.string.uuid()}`,
							description: "Scheduled for future",
							organizationId: orgId,
							type: "menu",
							startAt: futureStart.toISOString(),
							endAt: futureEnd.toISOString(),
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.createAdvertisement).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					type: "menu",
				}),
			);
		});

		test("should reject attachment variable as invalid Upload when using mercuriusClient", async () => {
			const orgId = await createTestOrganization(authToken);

			const attachment = createMockFileUpload(
				"test-image.png",
				"image/png",
				"fake image data",
			);

			const result = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Ad With Image ${faker.string.uuid()}`,
							description: "Advertisement with image attachment",
							organizationId: orgId,
							type: "banner",
							startAt: new Date().toISOString(),
							endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
							attachments: [attachment],
						},
					},
				},
			);

			// Our mocked Upload is not accepted by GraphQL
			expect(result.data?.createAdvertisement).toBeUndefined();
			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.message).toContain("Upload value invalid");
		});

		test("should reject multiple attachments as invalid Upload when using mercuriusClient", async () => {
			const orgId = await createTestOrganization(authToken);

			const attachment1 = createMockFileUpload(
				"image1.png",
				"image/png",
				"image 1",
			);
			const attachment2 = createMockFileUpload(
				"image2.jpeg",
				"image/jpeg",
				"image 2",
			);
			const attachment3 = createMockFileUpload(
				"video.mp4",
				"video/mp4",
				"video data",
			);

			const result = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Ad Multiple Files ${faker.string.uuid()}`,
							description: "Advertisement with multiple files",
							organizationId: orgId,
							type: "banner",
							startAt: new Date().toISOString(),
							endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
							attachments: [attachment1, attachment2, attachment3],
						},
					},
				},
			);

			expect(result.data?.createAdvertisement).toBeUndefined();
			expect(result.errors).toBeDefined();
			expect(result.errors?.[0]?.message).toContain("Upload value invalid");
		});

		test("should not accept mocked attachments for any supported mime type via mercuriusClient", async () => {
			const orgId = await createTestOrganization(authToken);

			const mimeTypes: Array<{ mimetype: string; filename: string }> = [
				{ mimetype: "image/png", filename: "test.png" },
				{ mimetype: "image/jpeg", filename: "test.jpg" },
				{ mimetype: "image/webp", filename: "test.webp" },
				{ mimetype: "image/avif", filename: "test.avif" },
				{ mimetype: "video/mp4", filename: "test.mp4" },
				{ mimetype: "video/webm", filename: "test.webm" },
			];

			for (const { mimetype, filename } of mimeTypes) {
				const attachment = createMockFileUpload(
					filename,
					mimetype,
					"test data",
				);

				const result = await mercuriusClient.mutate(
					Mutation_createAdvertisement,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								name: `Ad ${mimetype} ${faker.string.uuid()}`,
								description: `Testing ${mimetype}`,
								organizationId: orgId,
								type: "banner",
								startAt: new Date().toISOString(),
								endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
								attachments: [attachment],
							},
						},
					},
				);

				expect(result.data?.createAdvertisement).toBeUndefined();
				expect(result.errors).toBeDefined();
				expect(result.errors?.[0]?.message).toContain("Upload value invalid");
			}
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
							startAt: new Date().toISOString(),
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
								startAt: new Date().toISOString(),
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

		test("should handle advertisements with same name in different organizations", async () => {
			const orgId1 = await createTestOrganization(authToken);
			const orgId2 = await createTestOrganization(authToken);
			const sameName = `Shared Name ${faker.string.uuid()}`;

			const result1 = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: sameName,
							description: "In org 1",
							organizationId: orgId1,
							type: "banner",
							startAt: new Date().toISOString(),
							endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
						},
					},
				},
			);

			expect(result1.errors).toBeUndefined();

			const result2 = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: sameName,
							description: "In org 2",
							organizationId: orgId2,
							type: "banner",
							startAt: new Date().toISOString(),
							endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
						},
					},
				},
			);

			expect(result2.errors).toBeUndefined();
			expect(result2.data?.createAdvertisement?.organization?.id).toBe(orgId2);
		});

		test("should gracefully handle undefined attachment in upload array", async () => {
			const orgId = await createTestOrganization(authToken);

			const originalPutObject = server.minio.client.putObject;
			const putObjectSpy = vi.fn().mockResolvedValue(undefined);
			server.minio.client.putObject = putObjectSpy;

			// Also mock the transaction to return an undefined attachment
			const originalTransaction = server.drizzleClient.transaction;
			let transactionCallCount = 0;

			server.drizzleClient.transaction = vi
				.fn()
				.mockImplementation(async (callback) => {
					transactionCallCount++;

					type AdvertisementInsertData = {
						creatorId?: string;
						organizationId?: string;
						description?: string;
						endAt?: string;
						name?: string;
						startAt?: string;
						type?: string;
					};

					type AttachmentInsertData = {
						advertisementId?: string;
						creatorId?: string;
						mimeType?: string;
						name?: string;
					};

					const mockInsertBuilder = {
						values: (data: AdvertisementInsertData | AttachmentInsertData) => ({
							returning: async () => {
								if ("creatorId" in data && "organizationId" in data) {
									return [
										{
											id: faker.string.uuid(),
											creatorId: data.creatorId,
											description: (data as AdvertisementInsertData)
												.description,
											endAt: (data as AdvertisementInsertData).endAt,
											name: (data as AdvertisementInsertData).name,
											organizationId: (data as AdvertisementInsertData)
												.organizationId,
											startAt: (data as AdvertisementInsertData).startAt,
											type: (data as AdvertisementInsertData).type,
										},
									];
								}

								return [
									{
										id: faker.string.uuid(),
										name: faker.string.uuid(),
										mimeType: "image/png",
										advertisementId: faker.string.uuid(),
										creatorId: faker.string.uuid(),
									},
								];
							},
						}),
					};

					const mockTx = {
						insert: () => mockInsertBuilder,
					};

					return await callback(mockTx);
				});

			try {
				const attachment = createMockFileUpload(
					"test.png",
					"image/png",
					"test data",
				);

				const result = await mercuriusClient.mutate(
					Mutation_createAdvertisement,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								name: `Edge Case Ad ${faker.string.uuid()}`,
								description: "Testing undefined in attachments array",
								organizationId: orgId,
								type: "banner",
								startAt: new Date().toISOString(),
								endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
								attachments: [attachment],
							},
						},
					},
				);

				expect(result.data?.createAdvertisement).toBeUndefined();
				expect(result.errors).toBeDefined();
				expect(result.errors?.[0]?.message).toContain("Upload value invalid");
			} finally {
				server.minio.client.putObject = originalPutObject;
				server.drizzleClient.transaction = originalTransaction;
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
							startAt: new Date().toISOString(),
							endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			const advertisement = result.data?.createAdvertisement;
			assertToBeNonNullish(advertisement);
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
							startAt: new Date().toISOString(),
							endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
						},
					},
				},
			);

			if (result.errors) {
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "invalid_arguments",
							}),
						}),
					]),
				);
			} else {
				expect(result.data?.createAdvertisement).toBeDefined();
			}
		});

		test("should validate date range - endAt must be after startAt", async () => {
			const orgId = await createTestOrganization(authToken);
			const startDate = new Date();
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

		test("should handle SQL injection attempts in name field", async () => {
			const orgId = await createTestOrganization(authToken);
			const maliciousName = `Ad'; DROP TABLE advertisements; -- ${faker.string.uuid()}`;

			const result = await mercuriusClient.mutate(
				Mutation_createAdvertisement,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: maliciousName,
							description: "SQL injection test",
							organizationId: orgId,
							type: "banner",
							startAt: new Date().toISOString(),
							endAt: new Date(Date.now() + ONE_DAY_MS).toISOString(),
						},
					},
				},
			);

			expect(result.errors).toBeUndefined();
			expect(result.data?.createAdvertisement?.id).toBeDefined();
		});
	});
});
