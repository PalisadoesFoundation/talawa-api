import { faker } from "@faker-js/faker";
import { expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createTag,
	Mutation_deleteCurrentUser,
	Mutation_deleteTag,
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

suite("Mutation field deleteTag", () => {
	//// 1. Unauthenticated
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_deleteTag, {
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.deleteTag).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["deleteTag"],
					}),
				]),
			);
		});
	});

	//// 2. Invalid arguments
	suite("when arguments are invalid (parse error)", () => {
		test("should return an error with invalid_arguments extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_deleteTag, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: "invalid-id-format",
					},
				},
			});

			expect(result.data?.deleteTag).toBeNull();
			expect(
				result.errors?.some((error) => {
					const isResolverError =
						error.extensions?.code === "invalid_arguments";
					const isTypeValidationError =
						error.message.includes("got invalid value") ||
						error.message.includes("ID cannot represent") ||
						error.message.includes("Expected ID");
					return (
						(isResolverError || isTypeValidationError) &&
						error.path?.includes("deleteTag")
					);
				}),
			).toBe(true);
		});
	});

	//// 3. Tag not found
	suite("when the specified tag does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found extensions code", async () => {
			const nonExistentTagId = faker.string.uuid();

			const result = await mercuriusClient.mutate(Mutation_deleteTag, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: nonExistentTagId,
					},
				},
			});

			expect(result.data?.deleteTag).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["deleteTag"],
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

			// Create organization and tag as admin
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

			const createTagResult = await mercuriusClient.mutate(Mutation_createTag, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: `Tag ${faker.string.uuid()}`,
						organizationId: orgId,
					},
				},
			});
			const tagId = createTagResult.data?.createTag?.id;
			assertToBeNonNullish(tagId);

			// Delete the user
			await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
				headers: { authorization: `bearer ${userToken}` },
			});

			const result = await mercuriusClient.mutate(Mutation_deleteTag, {
				headers: { authorization: `bearer ${userToken}` },
				variables: {
					input: {
						id: tagId,
					},
				},
			});

			expect(result.data?.deleteTag).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["deleteTag"],
					}),
				]),
			);
		});
	});

	suite("when the user is not authorized to delete the tag", () => {
		test("should return an error when user is not a member of the organization", async () => {
			const { authToken: regularAuthToken } = await import(
				"../createRegularUserUsingAdmin"
			).then((module) => module.createRegularUserUsingAdmin());
			assertToBeNonNullish(regularAuthToken);

			// Create organization and tag as admin
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

			const createTagResult = await mercuriusClient.mutate(Mutation_createTag, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: `Tag ${faker.string.uuid()}`,
						organizationId: orgId,
					},
				},
			});
			const tagId = createTagResult.data?.createTag?.id;
			assertToBeNonNullish(tagId);

			// Try to delete as regular user (not a member)
			const result = await mercuriusClient.mutate(Mutation_deleteTag, {
				headers: { authorization: `bearer ${regularAuthToken}` },
				variables: {
					input: {
						id: tagId,
					},
				},
			});

			expect(result.data?.deleteTag).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
						path: ["deleteTag"],
					}),
				]),
			);
		});

		test("should return an error when user is a regular member without admin role", async () => {
			const { authToken: memberAuthToken, userId: memberId } = await import(
				"../createRegularUserUsingAdmin"
			).then((module) => module.createRegularUserUsingAdmin());
			assertToBeNonNullish(memberAuthToken);
			assertToBeNonNullish(memberId);

			// Create organization and tag as admin
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

			// Add the regular user as a MEMBER (not admin) of the organization
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: memberId,
						role: "regular",
					},
				},
			});

			const createTagResult = await mercuriusClient.mutate(Mutation_createTag, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: `Tag ${faker.string.uuid()}`,
						organizationId: orgId,
					},
				},
			});
			const tagId = createTagResult.data?.createTag?.id;
			assertToBeNonNullish(tagId);

			// Try to delete as regular member
			const result = await mercuriusClient.mutate(Mutation_deleteTag, {
				headers: { authorization: `bearer ${memberAuthToken}` },
				variables: {
					input: {
						id: tagId,
					},
				},
			});

			expect(result.data?.deleteTag).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
						path: ["deleteTag"],
					}),
				]),
			);
		});
	});

	suite("when the database delete operation unexpectedly fails", () => {
		test("should return an error with unexpected extensions code", async () => {
			// Create organization and tag
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

			const createTagResult = await mercuriusClient.mutate(Mutation_createTag, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: `Tag ${faker.string.uuid()}`,
						organizationId: orgId,
					},
				},
			});
			const tagId = createTagResult.data?.createTag?.id;
			assertToBeNonNullish(tagId);

			// Mock the delete method to return empty array
			const originalDelete = server.drizzleClient.delete;

			try {
				server.drizzleClient.delete = vi.fn().mockReturnValue({
					where: vi.fn().mockReturnThis(),
					returning: vi.fn().mockResolvedValue([]),
				});

				const result = await mercuriusClient.mutate(Mutation_deleteTag, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							id: tagId,
						},
					},
				});

				expect(result.data?.deleteTag).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({ code: "unexpected" }),
							path: ["deleteTag"],
						}),
					]),
				);
			} finally {
				// Restore original method
				server.drizzleClient.delete = originalDelete;
			}
		});
	});

	suite("when deleting tag successfully", () => {
		test("should successfully delete a tag as global administrator", async () => {
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

			const tagName = `Tag ${faker.string.uuid()}`;
			const createTagResult = await mercuriusClient.mutate(Mutation_createTag, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: tagName,
						organizationId: orgId,
					},
				},
			});
			const tagId = createTagResult.data?.createTag?.id;
			assertToBeNonNullish(tagId);

			// Delete tag
			const result = await mercuriusClient.mutate(Mutation_deleteTag, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: tagId,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.deleteTag).toEqual(
				expect.objectContaining({
					id: tagId,
					name: tagName,
				}),
			);
		});

		test("should successfully delete a tag as organization administrator", async () => {
			const { authToken: orgAdminToken, userId: orgAdminId } = await import(
				"../createRegularUserUsingAdmin"
			).then((module) => module.createRegularUserUsingAdmin());
			assertToBeNonNullish(orgAdminToken);
			assertToBeNonNullish(orgAdminId);

			// Create organization as global admin
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

			// Grant organization admin role
			await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						memberId: orgAdminId,
						role: "administrator",
					},
				},
			});

			const tagName = `Tag ${faker.string.uuid()}`;
			const createTagResult = await mercuriusClient.mutate(Mutation_createTag, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						name: tagName,
						organizationId: orgId,
					},
				},
			});
			const tagId = createTagResult.data?.createTag?.id;
			assertToBeNonNullish(tagId);

			// Delete tag as organization admin
			const result = await mercuriusClient.mutate(Mutation_deleteTag, {
				headers: { authorization: `bearer ${orgAdminToken}` },
				variables: {
					input: {
						id: tagId,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.deleteTag).toEqual(
				expect.objectContaining({
					id: tagId,
					name: tagName,
				}),
			);
		});
	});
});
