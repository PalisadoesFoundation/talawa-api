import { faker } from "@faker-js/faker";
import { expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createPost,
	Mutation_deleteCurrentUser,
	Mutation_joinPublicOrganization,
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
assertToBeNonNullish(signInResult.data?.signIn);
const authToken = signInResult.data.signIn.authenticationToken;
assertToBeNonNullish(authToken);

suite("Mutation field createPost", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_createPost, {
				variables: {
					input: {
						caption: "Test Post",
						organizationId: faker.string.uuid(),
						attachments: [
							{
								mimetype: "IMAGE_PNG",
								objectName: "test-object-name-isPinned",
								name: "test-image.png",
								fileHash: "test-file-hash-isPinned",
							},
						],
					},
				},
			});
			expect(result.data?.createPost).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["createPost"],
					}),
				]),
			);
		});
	});

	suite("when the specified organization does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						caption: "Test Post",
						organizationId: faker.string.uuid(),
						attachments: [
							{
								mimetype: "IMAGE_PNG",
								objectName: "test-object-name-isPinned",
								name: "test-image.png",
								fileHash: "test-file-hash-isPinned",
							},
						],
					},
				},
			});
			expect(result.data?.createPost).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["createPost"],
					}),
				]),
			);
		});
	});

	suite("when the client is not authorized to set pin status", () => {
		test("should return an error with unauthorized_action_on_arguments_associated_resources extensions code", async () => {
			const { authToken: regularAuthToken } = await import(
				"../createRegularUserUsingAdmin"
			).then((module) => module.createRegularUserUsingAdmin());
			assertToBeNonNullish(regularAuthToken);
			const adminSignInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(adminSignInResult.data?.signIn);
			const adminToken = adminSignInResult.data.signIn.authenticationToken;
			assertToBeNonNullish(adminToken);

			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: "Pin Org",
							description: "Org for pin test",
							countryCode: "us",
							state: "CA",
							city: "Los Angeles",
							postalCode: "90001",
							addressLine1: "123 Sunset Blvd",
							addressLine2: "Suite 200",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);
			const result = await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${regularAuthToken}` },
				variables: {
					input: {
						caption: "Pinned Post Attempt",
						organizationId: orgId,
						isPinned: true,
						attachments: [
							{
								mimetype: "IMAGE_PNG",
								objectName: "test-object-name-3",
								name: "test-image.png",
								fileHash: "test-file-hash-3",
							},
						],
					},
				},
			});
			expect(result.data?.createPost).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
						path: ["createPost"],
					}),
				]),
			);
		});
	});

	suite("when setting pin status", () => {
		test("should set pinnedAt when isPinned is true", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Pin Test Org",
							description: "Org to test isPinned true",
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
			const result = await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						caption: "Pinned Post",
						organizationId: orgId,
						isPinned: true,
						attachments: [
							{
								mimetype: "IMAGE_PNG",
								objectName: "test-object-name-4",
								name: "test-image.png",
								fileHash: "test-file-hash-4",
							},
						],
					},
				},
			});
			expect(result.errors).toBeUndefined();
			const post = result.data?.createPost;
			assertToBeNonNullish(post);
			expect(post).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					caption: "Pinned Post",
				}),
			);
			expect(post.pinnedAt).toBeDefined();
		});

		test("should leave pinnedAt undefined when isPinned is false", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Unpinned Test Org",
							description: "Org to test isPinned false",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "101 Test Ave",
							addressLine2: "Suite 2",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);
			const result = await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						caption: "Unpinned Post",
						organizationId: orgId,
						isPinned: false,
						attachments: [
							{
								mimetype: "IMAGE_PNG",
								objectName: "test-object-name-5",
								name: "test-image.png",
								fileHash: "test-file-hash-5",
							},
						],
					},
				},
			});
			expect(result.errors).toBeUndefined();
			const post = result.data?.createPost;
			assertToBeNonNullish(post);
			expect(post).toEqual(
				expect.objectContaining({
					id: expect.any(String),
					caption: "Unpinned Post",
				}),
			);
			expect(post.pinnedAt == null).toBe(true);
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
			const adminSignInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(adminSignInResult.data?.signIn);
			const adminToken = adminSignInResult.data.signIn.authenticationToken;
			assertToBeNonNullish(adminToken);

			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: "Test Org For Missing User",
							description: "Organization for currentUser undefined test",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "123 Main St",
							addressLine2: "Suite 100",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);
			const result = await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${userToken}` },
				variables: {
					input: {
						caption: "Test Post",
						organizationId: orgId,
						attachments: [
							{
								mimetype: "IMAGE_PNG",
								objectName: "test-object-name-00",
								name: "test-image.png",
								fileHash: "test-file-hash-00",
							},
						],
					},
				},
			});

			expect(result.data?.createPost ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["createPost"],
					}),
				]),
			);
		});
	});

	suite("when arguments are invalid (parse error)", () => {
		test("should return an error with invalid_arguments extension code", async () => {
			const invalidOrganizationId = "not-a-valid-uuid";
			const result = await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						caption: "Test Post",
						organizationId: invalidOrganizationId,
						attachments: [
							{
								mimetype: "IMAGE_PNG",
								objectName: "test-object-name-01",
								name: "test-image.png",
								fileHash: "test-file-hash-01",
							},
						],
					},
				},
			});

			expect(result.data?.createPost ?? null).toBeNull();
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
						path: ["createPost"],
					}),
				]),
			);
		});
	});

	suite("when the client is authenticated but not an administrator", () => {
		test("should return an error with unauthorized_arguments extensions code when setting isPinned", async () => {
			const { authToken: regularAuthToken } = await import(
				"../createRegularUserUsingAdmin"
			).then((module) => module.createRegularUserUsingAdmin());
			assertToBeNonNullish(regularAuthToken);

			const adminSignInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(adminSignInResult.data?.signIn);
			const adminToken = adminSignInResult.data.signIn.authenticationToken;
			assertToBeNonNullish(adminToken);

			// Create an organization using admin
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: "Unauthorized Args Test Org",
							description: "Org to test unauthorized arguments",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "123 Auth St",
							addressLine2: "Suite 100",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

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
			expect(joinResult.data?.joinPublicOrganization?.organizationId).toBe(
				orgId,
			);
			expect(joinResult.data?.joinPublicOrganization?.role).toBe("regular");

			const result = await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${regularAuthToken}` },
				variables: {
					input: {
						caption: "Unauthorized Pinned Post Attempt",
						organizationId: orgId,
						isPinned: true,
						attachments: [
							{
								mimetype: "IMAGE_PNG",
								objectName: "test-object-name-unauth",
								name: "test-image.png",
								fileHash: "test-file-hash-unauth",
							},
						],
					},
				},
			});

			expect(result.data?.createPost).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "isPinned"],
								}),
							]),
						}),
						path: ["createPost"],
					}),
				]),
			);
		});
	});

	suite("when the database insert operation unexpectedly fails", () => {
		test("should return an error with unexpected extensions code", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Error Test Org",
							description: "Organization for testing unexpected errors",
							countryCode: "us",
							state: "CA",
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: "123 Error St",
							addressLine2: "Suite 404",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			// Mock the transaction to simulate the error
			const originalTransaction = server.drizzleClient.transaction;
			server.drizzleClient.transaction = vi
				.fn()
				.mockImplementation(async (callback) => {
					// Create a mock transaction object with an insert method that returns empty array
					const mockTx = {
						insert: () => ({
							values: () => ({
								returning: async () => [],
							}),
						}),
					};

					// Call the callback with our mock transaction
					return await callback(mockTx);
				});

			try {
				const result = await mercuriusClient.mutate(Mutation_createPost, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							caption: "Post that should fail",
							organizationId: orgId,
							attachments: [
								{
									mimetype: "IMAGE_PNG",
									objectName: "test-object-name-error",
									name: "test-image.png",
									fileHash: "test-file-hash-error",
								},
							],
						},
					},
				});

				expect(result.data?.createPost).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unexpected",
							}),
							path: ["createPost"],
						}),
					]),
				);
			} finally {
				// Restore the original function
				server.drizzleClient.transaction = originalTransaction;
			}
		});
	});

	suite(
		"when the client is authorized and the post is created successfully",
		() => {
			test("should create a post and return the post data attachments", async () => {
				const createOrgResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								name: "Post Org Success",
								description: "Organization for post creation",
								countryCode: "us",
								state: "CA",
								city: "San Francisco",
								postalCode: "94101",
								addressLine1: "123 Main St",
								addressLine2: "Suite 100",
							},
						},
					},
				);
				const orgId = createOrgResult.data?.createOrganization?.id;
				assertToBeNonNullish(orgId);
				const result = await mercuriusClient.mutate(Mutation_createPost, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							caption: "Successful Post",
							organizationId: orgId,
							attachments: [
								{
									mimetype: "IMAGE_PNG",
									objectName: "test-object-name-99",
									name: "test-image.png",
									fileHash: "test-file-hash-99",
								},
							],
						},
					},
				});
				expect(result.errors).toBeUndefined();
				expect(result.data?.createPost).toEqual(
					expect.objectContaining({
						id: expect.any(String),
						caption: "Successful Post",
						attachments: [
							{
								mimeType: "image/png",
								objectName: "test-object-name-99",
								name: "test-image.png",
								fileHash: "test-file-hash-99",
							},
						],
						organization: expect.objectContaining({
							id: orgId,
						}),
						pinnedAt: null,
					}),
				);
			});

			test("should create a post with attachments if provided", async () => {
				const fakeAttachment: {
					mimetype:
						| "IMAGE_JPEG"
						| "IMAGE_AVIF"
						| "IMAGE_PNG"
						| "IMAGE_WEBP"
						| "VIDEO_MP4"
						| "VIDEO_WEBM";
					objectName: string;
					fileHash: string;
					name: string;
				} = {
					mimetype: "IMAGE_JPEG",
					objectName: "fake-object-name",
					fileHash: "fake-file-hash",
					name: "fake-name",
				};
				const createOrgResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								name: "Post Org With Attachments",
								description: "Organization for post with attachments",
								countryCode: "us",
								state: "CA",
								city: "San Francisco",
								postalCode: "94101",
								addressLine1: "123 Main St",
								addressLine2: "Suite 100",
							},
						},
					},
				);
				const orgId = createOrgResult.data?.createOrganization?.id;
				assertToBeNonNullish(orgId);
				const result = await mercuriusClient.mutate(Mutation_createPost, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							caption: "Post with Attachments",
							organizationId: orgId,
							attachments: [fakeAttachment],
						},
					},
				});
				expect(result.errors).toBeUndefined();
				expect(result.data?.createPost).toEqual(
					expect.objectContaining({
						id: expect.any(String),
						caption: "Post with Attachments",
						attachments: expect.arrayContaining([
							expect.objectContaining({
								mimeType: "image/jpeg",
								objectName: fakeAttachment.objectName,
								name: fakeAttachment.name,
								fileHash: fakeAttachment.fileHash,
							}),
						]),
						organization: expect.objectContaining({
							id: expect.any(String),
						}),
						pinnedAt: null,
					}),
				);
			});
		},
	);
});   