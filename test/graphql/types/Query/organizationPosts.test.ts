import { faker } from "@faker-js/faker";
import { afterEach, beforeAll, expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createPost,
	Mutation_deleteOrganization,
	Mutation_signUp,
	Query_postsByOrganization,
	Query_signIn,
} from "../documentNodes";

let authToken: string;
const cleanupFns: Array<() => Promise<void>> = [];

beforeAll(async () => {
	const signUpResult = await mercuriusClient.mutate(Mutation_signUp, {
		variables: {
			input: {
				emailAddress: `test-${faker.string.uuid()}@example.com`,
				password: "TestPassword123!",
				name: "Test User",
				selectedOrganization: "3891785a-1760-48a2-8d72-f5632ad1371b",
			},
		},
	});
		assertToBeNonNullish(signUpResult.data?.signUp);
		assertToBeNonNullish(signUpResult.data?.signUp?.authenticationToken);
		authToken = signUpResult.data!.signUp!.authenticationToken;
});

afterEach(async () => {
	for (const cleanup of cleanupFns.reverse()) {
		try {
			await cleanup();
		} catch (error) {
			console.error("Cleanup failed:", error);
		}
	}
	cleanupFns.length = 0;
});

suite("Query field postsByOrganization", () => {
	suite("Authentication", () => {
		test("returns error when user is unauthenticated", async () => {
			const result = await mercuriusClient.query(Query_postsByOrganization, {
				variables: { input: { organizationId: faker.string.uuid() } },
			});

			expect(result.data?.postsByOrganization).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["postsByOrganization"],
					}),
				]),
			);
		});
	});

	suite("Sorting", () => {
		test("returns posts sorted by createdAt in descending order", async () => {
			const orgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Test Org ${faker.string.uuid()}`,
							countryCode: "US",
						},
					},
				},
			);
			const orgId = orgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);
			cleanupFns.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const firstPostResult = await mercuriusClient.mutate(
				Mutation_createPost,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							organizationId: orgId,
							caption: "First Post",
							attachments: [],
						},
					},
				},
			);
			const firstPostId = firstPostResult.data?.createPost?.id;
			assertToBeNonNullish(firstPostId);

			const secondPostResult = await mercuriusClient.mutate(
				Mutation_createPost,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							organizationId: orgId,
							caption: "Second Post",
							attachments: [],
						},
					},
				},
			);
			const secondPostId = secondPostResult.data?.createPost?.id;
			assertToBeNonNullish(secondPostId);

			const result = await mercuriusClient.query(Query_postsByOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { organizationId: orgId, sortOrder: "DESC" } },
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.postsByOrganization).toHaveLength(2);
			const posts = result.data?.postsByOrganization ?? [];
			const postIds = posts.map((p: { id: string }) => p.id);
			expect(postIds).toContain(firstPostId);
			expect(postIds).toContain(secondPostId);
			expect(posts[0]?.id).toBe(secondPostId);
		});

		test("returns posts sorted by createdAt in ascending order", async () => {
			const orgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Test Org ${faker.string.uuid()}`,
							countryCode: "US",
						},
					},
				},
			);
			const orgId = orgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);
			cleanupFns.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const firstPostResult = await mercuriusClient.mutate(
				Mutation_createPost,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							organizationId: orgId,
							caption: "First Post",
							attachments: [],
						},
					},
				},
			);
			const firstPostId = firstPostResult.data?.createPost?.id;
			assertToBeNonNullish(firstPostId);

			const secondPostResult = await mercuriusClient.mutate(
				Mutation_createPost,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							organizationId: orgId,
							caption: "Second Post",
							attachments: [],
						},
					},
				},
			);
			const secondPostId = secondPostResult.data?.createPost?.id;
			assertToBeNonNullish(secondPostId);

			const result = await mercuriusClient.query(Query_postsByOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { organizationId: orgId, sortOrder: "ASC" } },
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.postsByOrganization).toHaveLength(2);
			const posts = result.data?.postsByOrganization ?? [];
			const postIds = posts.map((p: { id: string }) => p.id);
			expect(postIds).toContain(firstPostId);
			expect(postIds).toContain(secondPostId);
			expect(posts[0]?.id).toBe(firstPostId);
		});
	});

	suite("Empty Results", () => {
		test("returns empty array when organization has no posts", async () => {
			const orgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Empty Org ${faker.string.uuid()}`,
							countryCode: "US",
						},
					},
				},
			);
			const orgId = orgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);
			cleanupFns.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const result = await mercuriusClient.query(Query_postsByOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { organizationId: orgId } },
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.postsByOrganization).toEqual([]);
		});
	});

	suite("Authorization", () => {
		test("returns error when user is not a member of the organization", async () => {
			const nonMemberSignUp = await mercuriusClient.mutate(Mutation_signUp, {
				variables: {
					input: {
						emailAddress: `non-member-${faker.string.uuid()}@example.com`,
						password: "TestPassword123!",
						name: "Non Member User",
						selectedOrganization: "3891785a-1760-48a2-8d72-f5632ad1371b",
					},
				},
			});
			assertToBeNonNullish(nonMemberSignUp.data?.signUp);
			const nonMemberToken = nonMemberSignUp.data.signUp.authenticationToken;

			const orgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Test Org ${faker.string.uuid()}`,
							countryCode: "US",
						},
					},
				},
			);
			const orgId = orgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);
			cleanupFns.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const result = await mercuriusClient.query(Query_postsByOrganization, {
				headers: { authorization: `bearer ${nonMemberToken}` },
				variables: { input: { organizationId: orgId } },
			});

			expect(result.data?.postsByOrganization).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
						path: ["postsByOrganization"],
					}),
				]),
			);
		});

		test("administrator can access posts from any organization", async () => {
			// Create an org with the test user
			const orgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `AdminAccess Org ${faker.string.uuid()}`,
							countryCode: "US",
						},
					},
				},
			);
			const orgId = orgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);
			cleanupFns.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: orgId } },
				});
			});

			// Create a post in that org
			const createdPost = await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						organizationId: orgId,
						caption: "Admin Visible Post",
						attachments: [],
					},
				},
			});
			const createdPostId = createdPost.data?.createPost?.id;
			assertToBeNonNullish(createdPostId);

			// Sign in as administrator using server admin credentials
			const adminSignIn = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(adminSignIn.data?.signIn?.authenticationToken);
			const adminAuthToken = adminSignIn.data.signIn.authenticationToken;

			// Admin queries posts for the org they are not a member of
			const result = await mercuriusClient.query(Query_postsByOrganization, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: { input: { organizationId: orgId } },
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.postsByOrganization).toBeDefined();
			const posts = result.data?.postsByOrganization ?? [];
			expect(posts.map((p: { id: string }) => p.id)).toContain(createdPostId);
		});
	});

	suite("Invalid Organization ID", () => {
		test("returns error when organization does not exist", async () => {
			const fakeOrgId = faker.string.uuid();
			const result = await mercuriusClient.query(Query_postsByOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { organizationId: fakeOrgId } },
			});

			expect(result.data?.postsByOrganization).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["postsByOrganization"],
					}),
				]),
			);
		});
	});

	suite("Basic pagination / large results", () => {
		test("returns multiple posts when many exist", async () => {
			const orgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Pagination Org ${faker.string.uuid()}`,
							countryCode: "US",
						},
					},
				},
			);
			const orgId = orgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);
			cleanupFns.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const captions = ["Post 1", "Post 2", "Post 3", "Post 4", "Post 5"];
			for (const caption of captions) {
				await mercuriusClient.mutate(Mutation_createPost, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: { organizationId: orgId, caption, attachments: [] },
					},
				});
			}

			const allPostsResult = await mercuriusClient.query(
				Query_postsByOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { organizationId: orgId } },
				},
			);

			expect(allPostsResult.errors).toBeUndefined();
			expect(allPostsResult.data?.postsByOrganization).toBeDefined();
			const allPosts = allPostsResult.data?.postsByOrganization ?? [];
			expect(allPosts.length).toBeGreaterThanOrEqual(5);
		});
	});

	suite("Attachments", () => {
		test("returns posts with populated attachments", async () => {
			const orgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Attachments Org ${faker.string.uuid()}`,
							countryCode: "US",
						},
					},
				},
			);
			const orgId = orgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);
			cleanupFns.push(async () => {
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { id: orgId } },
				});
			});

			const attachmentsPayload = [
				{
					mimetype: "IMAGE_PNG",
					objectName: "obj1",
					fileHash: "hash1",
					name: "file1.png",
				},
				{
					mimetype: "IMAGE_JPEG",
					objectName: "obj2",
					fileHash: "hash2",
					name: "file2.jpg",
				},
			];

			const createPostResult = await mercuriusClient.mutate(
				Mutation_createPost,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							organizationId: orgId,
							caption: "Post with attachments",
							attachments: attachmentsPayload,
						},
					},
				},
			);
			const createdPostId = createPostResult.data?.createPost?.id;
			assertToBeNonNullish(createdPostId);

			const result = await mercuriusClient.query(Query_postsByOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: { input: { organizationId: orgId } },
			});

			expect(result.errors).toBeUndefined();
			const posts = result.data?.postsByOrganization ?? [];
			const post = posts.find((p: { id: string }) => p.id === createdPostId);
			expect(post).toBeDefined();
			const attachments = post?.attachments ?? [];
			expect(attachments.length).toBeGreaterThanOrEqual(2);
			expect(attachments[0]).toEqual(
				expect.objectContaining({
					mimeType: "image/png",
					objectName: "obj1",
					fileHash: "hash1",
					name: "file1.png",
				}),
			);
			expect(attachments[1]).toEqual(
				expect.objectContaining({
					mimeType: "image/jpeg",
					objectName: "obj2",
					fileHash: "hash2",
					name: "file2.jpg",
				}),
			);
		});
	});
});
