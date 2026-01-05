import { faker } from "@faker-js/faker";
import { afterEach, expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createTag,
	Mutation_deleteCurrentUser,
	Mutation_joinPublicOrganization,
	Query_signIn,
} from "../documentNodes";

const Mutation_updateTag_Local = /* GraphQL */ `
  mutation UpdateTag($input: MutationUpdateTagInput!) {
    updateTag(input: $input) {
      id
      name
      folder {
        id
      }
      organization {
        id
      }
      createdAt
      updatedAt
    }
  }
`;

export const Mutation_createTagFolder = /* GraphQL */ `
  mutation CreateTagFolder($input: MutationCreateTagFolderInput!) {
    createTagFolder(input: $input) {
      id
      name
      organization {
        id
      }
      createdAt
      updatedAt
    }
  }
`;

// Sign in as admin for tests
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

suite("Mutation field updateTag", () => {
	afterEach(async () => {
		// Clear rate limit keys to prevent rate limiting between tests
		const keys = await server.redis.keys("rate-limit:*");
		if (keys.length > 0) {
			await server.redis.del(...keys);
		}
	});

	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_updateTag_Local, {
				variables: {
					input: {
						id: faker.string.uuid(),
						name: "Updated Tag",
					},
				},
			});

			expect(result.data?.updateTag).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["updateTag"],
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

			const result = await mercuriusClient.mutate(Mutation_updateTag_Local, {
				headers: { authorization: `bearer ${userToken}` },
				variables: {
					input: {
						id: faker.string.uuid(),
						name: "Updated Tag",
					},
				},
			});

			expect(result.data?.updateTag).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["updateTag"],
					}),
				]),
			);
		});
	});

	suite("when arguments are invalid (parse error)", () => {
		test("should return an error with invalid_arguments extension code for invalid tag id", async () => {
			const result = await mercuriusClient.mutate(Mutation_updateTag_Local, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: "not-a-valid-uuid",
						name: "Updated Tag",
					},
				},
			});

			expect(result.data?.updateTag).toBeNull();
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
						path: ["updateTag"],
					}),
				]),
			);
		});

		test("should return an error with invalid_arguments extension code for invalid folder id", async () => {
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

			const createTagResult = await mercuriusClient.mutate(Mutation_createTag, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Test Tag",
						organizationId: orgId,
					},
				},
			});
			const tagId = createTagResult.data?.createTag?.id;
			assertToBeNonNullish(tagId);

			const result = await mercuriusClient.mutate(Mutation_updateTag_Local, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: tagId,
						folderId: "not-a-valid-uuid",
					},
				},
			});

			expect(result.data?.updateTag).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "folderId"],
								}),
							]),
						}),
						path: ["updateTag"],
					}),
				]),
			);
		});
	});

	suite("when the specified tag does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_updateTag_Local, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: faker.string.uuid(),
						name: "Updated Tag",
					},
				},
			});

			expect(result.data?.updateTag).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["updateTag"],
					}),
				]),
			);
		});
	});

	suite("when the specified folderId tag does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found extensions code", async () => {
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

			const createTagResult = await mercuriusClient.mutate(Mutation_createTag, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Test Tag",
						organizationId: orgId,
					},
				},
			});
			const tagId = createTagResult.data?.createTag?.id;
			assertToBeNonNullish(tagId);

			const result = await mercuriusClient.mutate(Mutation_updateTag_Local, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: tagId,
						folderId: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.updateTag).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "folderId"],
								}),
							]),
						}),
						path: ["updateTag"],
					}),
				]),
			);
		});
	});

	suite(
		"when the folderId folder does not belong to the same organization",
		() => {
			test("should return an error with forbidden_action_on_arguments_associated_resources extensions code", async () => {
				const createOrg1Result = await mercuriusClient.mutate(
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
				const org1Id = createOrg1Result.data?.createOrganization?.id;
				assertToBeNonNullish(org1Id);

				// Create a tag/folder in org1
				const createFolderResult = await mercuriusClient.mutate(
					Mutation_createTagFolder,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								name: "Folder in Org 1",
								organizationId: org1Id,
							},
						},
					},
				);
				const folderId = createFolderResult.data?.createTagFolder?.id;
				assertToBeNonNullish(folderId);

				// Create second organization with tag to update
				const createOrg2Result = await mercuriusClient.mutate(
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
				const org2Id = createOrg2Result.data?.createOrganization?.id;
				assertToBeNonNullish(org2Id);

				const createTagResult = await mercuriusClient.mutate(
					Mutation_createTag,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								name: "Tag in Org 2",
								organizationId: org2Id,
							},
						},
					},
				);
				const tagId = createTagResult.data?.createTag?.id;
				assertToBeNonNullish(tagId);

				// Try to update tag in org2 with folderId from org1
				const result = await mercuriusClient.mutate(Mutation_updateTag_Local, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: tagId,
							folderId: folderId,
						},
					},
				});

				expect(result.data?.updateTag).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "forbidden_action_on_arguments_associated_resources",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "folderId"],
										message:
											"This tag does not belong to the associated organization.",
									}),
								]),
							}),
							path: ["updateTag"],
						}),
					]),
				);
			});
		},
	);

	suite("when updating tag name to one that already exists", () => {
		test("should return an error with forbidden_action_on_arguments_associated_resources extensions code", async () => {
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

			// Create two tags with different names
			const createTag1Result = await mercuriusClient.mutate(
				Mutation_createTag,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Existing Tag Name",
							organizationId: orgId,
						},
					},
				},
			);
			assertToBeNonNullish(createTag1Result.data?.createTag?.id);

			const createTag2Result = await mercuriusClient.mutate(
				Mutation_createTag,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: "Other Tag Name",
							organizationId: orgId,
						},
					},
				},
			);
			const tag2Id = createTag2Result.data?.createTag?.id;
			assertToBeNonNullish(tag2Id);

			// Try to update tag2 to have the same name as tag1
			const result = await mercuriusClient.mutate(Mutation_updateTag_Local, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: tag2Id,
						name: "Existing Tag Name",
					},
				},
			});

			expect(result.data?.updateTag).toBeNull();
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
						path: ["updateTag"],
					}),
				]),
			);
		});
	});

	suite("when the client is not an administrator", () => {
		test("should return an error with unauthorized_action_on_arguments_associated_resources extensions code when non-member", async () => {
			const { authToken: regularAuthToken } = await import(
				"../createRegularUserUsingAdmin"
			).then((module) => module.createRegularUserUsingAdmin());
			assertToBeNonNullish(regularAuthToken);

			// Admin creates organization and tag
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

			const createTagResult = await mercuriusClient.mutate(Mutation_createTag, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Test Tag",
						organizationId: orgId,
					},
				},
			});
			const tagId = createTagResult.data?.createTag?.id;
			assertToBeNonNullish(tagId);

			// Regular user (not a member) tries to update
			const result = await mercuriusClient.mutate(Mutation_updateTag_Local, {
				headers: { authorization: `bearer ${regularAuthToken}` },
				variables: {
					input: {
						id: tagId,
						name: "Updated Tag",
					},
				},
			});

			expect(result.data?.updateTag).toBeNull();
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
						path: ["updateTag"],
					}),
				]),
			);
		});

		test("should return an error with unauthorized_action_on_arguments_associated_resources extensions code when regular member", async () => {
			const { authToken: regularAuthToken } = await import(
				"../createRegularUserUsingAdmin"
			).then((module) => module.createRegularUserUsingAdmin());
			assertToBeNonNullish(regularAuthToken);

			// Admin creates organization and tag
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

			// Regular user joins organization
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
			expect(joinResult.data?.joinPublicOrganization?.role).toBe("regular");

			const createTagResult = await mercuriusClient.mutate(Mutation_createTag, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Test Tag",
						organizationId: orgId,
					},
				},
			});
			const tagId = createTagResult.data?.createTag?.id;
			assertToBeNonNullish(tagId);

			// Regular member (non-admin) tries to update
			const result = await mercuriusClient.mutate(Mutation_updateTag_Local, {
				headers: { authorization: `bearer ${regularAuthToken}` },
				variables: {
					input: {
						id: tagId,
						name: "Updated Tag",
					},
				},
			});

			expect(result.data?.updateTag).toBeNull();
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
						path: ["updateTag"],
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
							city: "San Francisco",
							postalCode: "94101",
							addressLine1: faker.location.streetAddress(),
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const createTagResult = await mercuriusClient.mutate(Mutation_createTag, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Test Tag",
						organizationId: orgId,
					},
				},
			});
			const tagId = createTagResult.data?.createTag?.id;
			assertToBeNonNullish(tagId);

			// Mock the database update to return empty array
			const originalUpdate = server.drizzleClient.update;
			server.drizzleClient.update = vi.fn().mockImplementation(() => ({
				set: () => ({
					where: () => ({
						returning: async () => [],
					}),
				}),
			}));

			try {
				const result = await mercuriusClient.mutate(Mutation_updateTag_Local, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: tagId,
							name: "Updated Tag Name",
						},
					},
				});

				expect(result.data?.updateTag).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unexpected",
							}),
							path: ["updateTag"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.update = originalUpdate;
			}
		});
	});

	suite(
		"when the client is authorized and the tag is updated successfully",
		() => {
			test("should successfully update tag name only", async () => {
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

				const createTagResult = await mercuriusClient.mutate(
					Mutation_createTag,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								name: "Original Tag Name",
								organizationId: orgId,
							},
						},
					},
				);
				const tagId = createTagResult.data?.createTag?.id;
				assertToBeNonNullish(tagId);

				const result = await mercuriusClient.mutate(Mutation_updateTag_Local, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: tagId,
							name: "Updated Tag Name",
						},
					},
				});

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateTag).toEqual(
					expect.objectContaining({
						id: tagId,
						name: "Updated Tag Name",
					}),
				);
			});

			test("should successfully update tag with valid folderId from same organization", async () => {
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

				// Create a tag folder
				const createFolderResult = await mercuriusClient.mutate(
					Mutation_createTagFolder,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								name: "Test Folder",
								organizationId: orgId,
							},
						},
					},
				);
				const folderId = createFolderResult.data?.createTagFolder?.id;
				assertToBeNonNullish(folderId);

				// Create a tag
				const createTagResult = await mercuriusClient.mutate(
					Mutation_createTag,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								name: "Test Tag",
								organizationId: orgId,
							},
						},
					},
				);
				const tagId = createTagResult.data?.createTag?.id;
				assertToBeNonNullish(tagId);

				// Update tag with folderId from same organization
				const result = await mercuriusClient.mutate(Mutation_updateTag_Local, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: tagId,
							folderId: folderId,
						},
					},
				});

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateTag).toEqual(
					expect.objectContaining({
						id: tagId,
						folder: expect.objectContaining({
							id: folderId,
						}),
					}),
				);
			});
		},
	);

	suite("edge cases and validation", () => {
		test("should successfully handle tag names with special characters", async () => {
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

			const createTagResult = await mercuriusClient.mutate(Mutation_createTag, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Normal Tag",
						organizationId: orgId,
					},
				},
			});
			const tagId = createTagResult.data?.createTag?.id;
			assertToBeNonNullish(tagId);

			const specialName = "Tag-Name_2024!@#$%^&*()";
			const result = await mercuriusClient.mutate(Mutation_updateTag_Local, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: tagId,
						name: specialName,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateTag).toBeDefined();
			expect(result.data?.updateTag?.name).toBe(specialName);
		});

		test("should successfully handle unicode characters in tag name", async () => {
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

			const createTagResult = await mercuriusClient.mutate(Mutation_createTag, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: "Original",
						organizationId: orgId,
					},
				},
			});
			const tagId = createTagResult.data?.createTag?.id;
			assertToBeNonNullish(tagId);

			const unicodeName = "Tag 标签 टैग тег 🏷️";
			const result = await mercuriusClient.mutate(Mutation_updateTag_Local, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: tagId,
						name: unicodeName,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.updateTag?.name).toBe(unicodeName);
		});
	});
});
