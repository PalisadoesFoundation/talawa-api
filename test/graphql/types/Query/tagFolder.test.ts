import { faker } from "@faker-js/faker";
import { initGraphQLTada } from "gql.tada";
import { expect, suite, test } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionOnArgumentsAssociatedResourcesExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Mutation_deleteUser,
} from "../documentNodes";
import type { introspection } from "../gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

const Query_tagFolder = gql(`
  query tagFolder($input:QueryTagFolderInput!) {
    tagFolder(input: $input) {
      id
      name
      createdAt
      updatedAt
    }
  }
`);

const Mutation_createTagFolder = gql(`
  mutation CreateTagFolder($input:MutationCreateTagFolderInput!) {
    createTagFolder(input: $input) {
      id
      name
      createdAt
      updatedAt
    }
  }
`);

async function getAdminToken(): Promise<string> {
	const { accessToken } = await getAdminAuthViaRest(server);
	return accessToken;
}

suite("Query field tagFolder", () => {
	test("results in a graphql error with 'invalid_arguments' if an invalid id is provided", async () => {
		const adminToken = await getAdminToken();

		const tagFolderResult = await mercuriusClient.query(Query_tagFolder, {
			headers: {
				authorization: `bearer ${adminToken}`,
			},
			variables: {
				input: {
					id: "invalid-id", // Not a valid UUID
				},
			},
		});

		expect(tagFolderResult.data.tagFolder).toEqual(null);
		expect(tagFolderResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
					}),
					message: expect.any(String),
					path: ["tagFolder"],
				}),
			]),
		);
	});

	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.tagFolder" field if`,
		() => {
			test("client triggering the graphql operation is not authenticated.", async () => {
				const tagFolderResult = await mercuriusClient.query(Query_tagFolder, {
					variables: {
						input: {
							id: faker.string.uuid(),
						},
					},
				});
				expect(tagFolderResult.data.tagFolder).toEqual(null);
				expect(tagFolderResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["tagFolder"],
						}),
					]),
				);
			});

			test("client triggering the graphql operation has no existing user associated to their authentication context.", async () => {
				const adminToken = await getAdminToken();

				const createUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								emailAddress: `emailAddress${faker.string.ulid()}@email.com`,
								isEmailAddressVerified: false,
								name: "name",
								password: "password",
								role: "regular",
							},
						},
					},
				);

				assertToBeNonNullish(
					createUserResult.data.createUser?.authenticationToken,
				);
				assertToBeNonNullish(createUserResult.data.createUser.user?.id);

				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: {
						authorization: `bearer ${adminToken}`,
					},
					variables: {
						input: {
							id: createUserResult.data.createUser.user.id,
						},
					},
				});

				const tagFolderResult = await mercuriusClient.query(Query_tagFolder, {
					headers: {
						authorization: `bearer ${createUserResult.data.createUser.authenticationToken}`,
					},
					variables: {
						input: {
							id: faker.string.uuid(),
						},
					},
				});

				expect(tagFolderResult?.data?.tagFolder).toBeNull();
				expect(tagFolderResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["tagFolder"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "arguments_associated_resources_not_found" extensions code in the "errors" field and "null" as the value of "data.tagFolder" field if`,
		() => {
			test("the specified tag folder does not exist", async () => {
				const adminToken = await getAdminToken();

				const tagFolderResult = await mercuriusClient.query(Query_tagFolder, {
					headers: {
						authorization: `bearer ${adminToken}`,
					},
					variables: {
						input: {
							id: faker.string.uuid(),
						},
					},
				});

				expect(tagFolderResult.data.tagFolder).toEqual(null);
				expect(tagFolderResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions:
								expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
									{
										code: "arguments_associated_resources_not_found",
										issues: expect.arrayContaining([
											expect.objectContaining({
												argumentPath: ["input", "id"],
											}),
										]),
									},
								),
							message: expect.any(String),
							path: ["tagFolder"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "unauthorized_action_on_arguments_associated_resources" extensions code in the "errors" field and "null" as the value of "data.tagFolder" field if`,
		() => {
			test("regular user tries to access tag folder without organization membership", async () => {
				// Step 1: Admin Sign-in
				const adminToken = await getAdminToken();

				// Step 2: Create Regular User
				const regularUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								emailAddress: `${faker.string.uuid()}@test.com`,
								password: "password123",
								name: "Regular User",
								role: "regular",
								isEmailAddressVerified: true,
							},
						},
					},
				);

				const regularUserToken =
					regularUserResult.data?.createUser?.authenticationToken;
				if (!regularUserToken) throw new Error("Regular user creation failed");

				// Step 3: Create Organization with unique name
				const organizationResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								name: `Test Org ${faker.string.uuid()}`,
								addressLine1: "123 Main St",
								city: "New York",
								countryCode: "us",
								description: "Test Description",
							},
						},
					},
				);

				if (organizationResult.errors) {
					throw new Error(
						`Organization creation failed: ${JSON.stringify(organizationResult.errors)}`,
					);
				}
				const organizationId = organizationResult.data?.createOrganization?.id;
				if (!organizationId) throw new Error("Organization ID not found");

				// Step 4: Create tag folder
				const tagFolderCreationResult = await mercuriusClient.mutate(
					Mutation_createTagFolder,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								name: "Test Tag Folder",
								organizationId: organizationId,
							},
						},
					},
				);

				const tagFolderId = tagFolderCreationResult.data?.createTagFolder?.id;
				if (!tagFolderId) throw new Error("Tag folder creation failed");

				// Step 5: Attempt to query tag folder with regular user (not a member)
				const tagFolderQueryResult = await mercuriusClient.query(
					Query_tagFolder,
					{
						headers: {
							authorization: `bearer ${regularUserToken}`,
						},
						variables: {
							input: {
								id: tagFolderId,
							},
						},
					},
				);

				expect(tagFolderQueryResult.data.tagFolder).toBeNull();
				expect(tagFolderQueryResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions:
								expect.objectContaining<UnauthorizedActionOnArgumentsAssociatedResourcesExtensions>(
									{
										code: "unauthorized_action_on_arguments_associated_resources",
										issues: expect.arrayContaining([
											expect.objectContaining({
												argumentPath: ["input", "id"],
											}),
										]),
									},
								),
							message: expect.any(String),
							path: ["tagFolder"],
						}),
					]),
				);
			});

			test("regular user tries to access tag folder with organization membership but not as admin", async () => {
				// Step 1: Admin Sign-in
				const adminToken = await getAdminToken();

				// Step 2: Create Regular User
				const regularUserResult = await mercuriusClient.mutate(
					Mutation_createUser,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								emailAddress: `${faker.string.uuid()}@test.com`,
								password: "password123",
								name: "Regular User",
								role: "regular",
								isEmailAddressVerified: true,
							},
						},
					},
				);

				const regularUserId = regularUserResult.data?.createUser?.user?.id;
				const regularUserToken =
					regularUserResult.data?.createUser?.authenticationToken;
				if (!regularUserToken || !regularUserId)
					throw new Error("Regular user creation failed");

				// Step 3: Create Organization
				const organizationResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								name: `Test Org ${faker.string.uuid()}`,
								addressLine1: "123 Main St",
								city: "New York",
								countryCode: "us",
								description: "Test Description",
							},
						},
					},
				);

				const organizationId = organizationResult.data?.createOrganization?.id;
				if (!organizationId) throw new Error("Organization creation failed");

				// Step 4: Add regular user to organization as regular member (not admin)
				await mercuriusClient.mutate(Mutation_createOrganizationMembership, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							organizationId,
							memberId: regularUserId,
						},
					},
				});

				// Step 5: Create tag folder
				const tagFolderCreationResult = await mercuriusClient.mutate(
					Mutation_createTagFolder,
					{
						headers: {
							authorization: `bearer ${adminToken}`,
						},
						variables: {
							input: {
								name: "Test Tag Folder",
								organizationId: organizationId,
							},
						},
					},
				);

				const tagFolderId = tagFolderCreationResult.data?.createTagFolder?.id;
				if (!tagFolderId) throw new Error("Tag folder creation failed");

				// Step 6: Attempt to query tag folder with regular user (member but not admin)
				const tagFolderQueryResult = await mercuriusClient.query(
					Query_tagFolder,
					{
						headers: {
							authorization: `bearer ${regularUserToken}`,
						},
						variables: {
							input: {
								id: tagFolderId,
							},
						},
					},
				);

				expect(tagFolderQueryResult.data.tagFolder).toBeNull();
				expect(tagFolderQueryResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions:
								expect.objectContaining<UnauthorizedActionOnArgumentsAssociatedResourcesExtensions>(
									{
										code: "unauthorized_action_on_arguments_associated_resources",
										issues: expect.arrayContaining([
											expect.objectContaining({
												argumentPath: ["input", "id"],
											}),
										]),
									},
								),
							message: expect.any(String),
							path: ["tagFolder"],
						}),
					]),
				);
			});
		},
	);

	test("results in an empty 'errors' field and the expected value for the 'data.tagFolder' field when accessed by administrator", async () => {
		// Step 1: Admin Sign-in
		const adminToken = await getAdminToken();

		// Step 2: Create Organization with unique name
		const organizationResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: {
					authorization: `bearer ${adminToken}`,
				},
				variables: {
					input: {
						name: `Test Org ${faker.string.uuid()}`,
						addressLine1: "123 Test St",
						city: "New York",
						countryCode: "us",
						description: "Test Description",
					},
				},
			},
		);

		if (organizationResult.errors) {
			throw new Error(
				`Organization creation failed: ${JSON.stringify(organizationResult.errors)}`,
			);
		}

		const organization = organizationResult.data?.createOrganization;
		if (!organization) throw new Error("Organization data not found");

		// Step 3: Create Tag Folder
		const tagFolderResult = await mercuriusClient.mutate(
			Mutation_createTagFolder,
			{
				headers: {
					authorization: `bearer ${adminToken}`,
				},
				variables: {
					input: {
						name: "Test Tag Folder",
						organizationId: organization.id,
					},
				},
			},
		);

		if (tagFolderResult.errors) {
			throw new Error(
				`Tag folder creation failed: ${JSON.stringify(tagFolderResult.errors)}`,
			);
		}

		const tagFolder = tagFolderResult.data?.createTagFolder;
		if (!tagFolder) throw new Error("Tag folder data not found");

		// Step 4: Query Tag Folder
		const queriedTagFolderResult = await mercuriusClient.query(
			Query_tagFolder,
			{
				headers: {
					authorization: `bearer ${adminToken}`,
				},
				variables: {
					input: {
						id: tagFolder.id,
					},
				},
			},
		);

		expect(queriedTagFolderResult.errors).toBeUndefined();
		assertToBeNonNullish(queriedTagFolderResult.data.tagFolder);
		expect(queriedTagFolderResult.data.tagFolder).toMatchObject({
			id: tagFolder.id,
			name: "Test Tag Folder",
			createdAt: expect.any(String),
		});
		// updatedAt is always present in the response (can be null or a date string)
		expect(queriedTagFolderResult.data.tagFolder.updatedAt).toBeDefined();
	});

	test("regular user can access tag folder when they are an organization administrator", async () => {
		const adminToken = await getAdminToken();

		// Step 2: Create Regular User
		const regularUserResult = await mercuriusClient.mutate(
			Mutation_createUser,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						emailAddress: `${faker.string.uuid()}@test.com`,
						password: "password123",
						name: "Regular User",
						role: "regular",
						isEmailAddressVerified: true,
					},
				},
			},
		);
		const regularUserId = regularUserResult.data?.createUser?.user?.id;
		const regularUserToken =
			regularUserResult.data?.createUser?.authenticationToken;
		if (!regularUserToken || !regularUserId)
			throw new Error("Regular user creation failed");

		// Step 3: Create Organization
		const organizationResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						name: `Test Org ${faker.string.uuid()}`,
						addressLine1: "123 Main St",
						city: "New York",
						countryCode: "us",
						description: "Test Description",
					},
				},
			},
		);
		const organizationId = organizationResult.data?.createOrganization?.id;
		if (!organizationId) throw new Error("Organization creation failed");

		// Step 4: Add regular user to organization as administrator
		const membershipResult = await mercuriusClient.mutate(
			Mutation_createOrganizationMembership,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						organizationId,
						memberId: regularUserId,
						role: "administrator",
					},
				},
			},
		);

		if (!membershipResult.data?.createOrganizationMembership) {
			throw new Error("Organization membership creation failed");
		}

		// Step 5: Create Tag Folder
		const tagFolderCreationResult = await mercuriusClient.mutate(
			Mutation_createTagFolder,
			{
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: {
						name: "Test Tag Folder",
						organizationId,
					},
				},
			},
		);
		const tagFolderId = tagFolderCreationResult.data?.createTagFolder?.id;
		if (!tagFolderId) throw new Error("Tag folder creation failed");

		// Step 6: Query Tag Folder as Regular User (who is org admin)
		const tagFolderQueryResult = await mercuriusClient.query(Query_tagFolder, {
			headers: { authorization: `bearer ${regularUserToken}` },
			variables: { input: { id: tagFolderId } },
		});

		expect(tagFolderQueryResult.errors).toBeUndefined();
		assertToBeNonNullish(tagFolderQueryResult.data.tagFolder);
		const queriedTagFolder = tagFolderQueryResult.data.tagFolder;
		expect(queriedTagFolder).toMatchObject({
			id: tagFolderId,
			name: "Test Tag Folder",
			createdAt: expect.any(String),
		});
		// updatedAt is always present in the response (can be null or a date string)
		expect(queriedTagFolder.updatedAt).toBeDefined();
	});

	test("results in a graphql error with 'unauthenticated' if authorization header is empty", async () => {
		const tagFolderResult = await mercuriusClient.query(Query_tagFolder, {
			headers: {
				authorization: "",
			},
			variables: {
				input: {
					id: faker.string.uuid(),
				},
			},
		});

		expect(tagFolderResult.data.tagFolder).toEqual(null);
		expect(tagFolderResult.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining<TalawaGraphQLFormattedError>({
					extensions: expect.objectContaining<UnauthenticatedExtensions>({
						code: "unauthenticated",
					}),
					message: expect.any(String),
					path: ["tagFolder"],
				}),
			]),
		);
	});
});
