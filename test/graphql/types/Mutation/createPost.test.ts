import { faker } from "@faker-js/faker";
import { expect, suite, test, vi } from "vitest";
import {
	POST_BODY_MAX_LENGTH,
	POST_CAPTION_MAX_LENGTH,
} from "~/src/drizzle/tables/posts";
import type { InvalidArgumentsExtensions } from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createOrganization,
	Mutation_createPost,
	Mutation_deleteCurrentUser,
	Mutation_joinPublicOrganization,
} from "../documentNodes";

const { accessToken: authToken } = await getAdminAuthViaRest(server);
assertToBeNonNullish(authToken);

suite("Mutation field createPost", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_createPost, {
				variables: {
					input: {
						caption: "Test Post",
						organizationId: faker.string.uuid(),
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
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
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
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
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

			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
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
			test("should create a post and return the post data", async () => {
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
						},
					},
				});
				expect(result.errors).toBeUndefined();
				expect(result.data?.createPost).toEqual(
					expect.objectContaining({
						id: expect.any(String),
						caption: "Successful Post",
						organization: expect.objectContaining({
							id: orgId,
						}),
						pinnedAt: null,
					}),
				);
			});
		},
	);

	suite("security checks", () => {
		test("should escape HTML in caption", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							description: faker.lorem.sentence(),
							countryCode: "jm",
							state: "St. Andrew",
							city: "Kingston",
							postalCode: "12345",
							addressLine1: faker.location.streetAddress(),
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const htmlCaption = "<script>alert('xss')</script>";
			const result = await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						caption: htmlCaption,
						organizationId: orgId,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createPost?.caption).toBe(
				"&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;",
			);
		});

		test("should reject caption exceeding length limit", async () => {
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: faker.company.name(),
							description: faker.lorem.sentence(),
							countryCode: "jm",
							state: "St. Andrew",
							city: "Kingston",
							postalCode: "12345",
							addressLine1: faker.location.streetAddress(),
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const longCaption = "a".repeat(POST_CAPTION_MAX_LENGTH + 1);
			const result = await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						caption: longCaption,
						organizationId: orgId,
					},
				},
			});

			expect(result.data?.createPost).toBeNull();
			expect(result.errors).toBeDefined();
			const issues = (
				result.errors?.[0]?.extensions as unknown as InvalidArgumentsExtensions
			)?.issues;
			const issueMessages = issues?.map((i) => i.message).join(" ");
			expect(issueMessages).toContain(
				`Post caption must not exceed ${POST_CAPTION_MAX_LENGTH} characters`,
			);
		});

		test("should create post with valid body field and return body in response", async () => {
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
							addressLine1: "123 Main St",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const validBody = "This is a test post body with valid content.";
			const result = await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						caption: "Test Caption",
						body: validBody,
						organizationId: orgId,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createPost?.body).toBe(validBody);
			expect(result.data?.createPost?.caption).toBe("Test Caption");
		});

		test("should create post with body at exactly POST_BODY_MAX_LENGTH", async () => {
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
							addressLine1: "456 Broadway",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const maxLengthBody = "a".repeat(POST_BODY_MAX_LENGTH);
			const result = await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						caption: "Max Length Body Test",
						body: maxLengthBody,
						organizationId: orgId,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createPost?.body).toBe(maxLengthBody);
			expect(result.data?.createPost?.body?.length).toBe(POST_BODY_MAX_LENGTH);
		});

		test("should reject body exceeding POST_BODY_MAX_LENGTH", async () => {
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
							city: "Houston",
							postalCode: "77001",
							addressLine1: "789 Main St",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const exceedingLengthBody = "a".repeat(POST_BODY_MAX_LENGTH + 1);
			const result = await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						caption: "Exceeding Body Test",
						body: exceedingLengthBody,
						organizationId: orgId,
					},
				},
			});

			expect(result.data?.createPost).toBeNull();
			expect(result.errors).toBeDefined();
			const issues = (
				result.errors?.[0]?.extensions as unknown as InvalidArgumentsExtensions
			)?.issues;
			const issueMessages = issues?.map((i) => i.message).join(" ");
			expect(issueMessages).toContain(
				`Post body must not exceed ${POST_BODY_MAX_LENGTH} characters`,
			);
		});

		test("should properly escape HTML/XSS payloads in body", async () => {
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
							addressLine1: "200 Pine St",
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const htmlBody =
				"<script>alert('xss')</script><img src=x onerror=alert('xss')>";
			const result = await mercuriusClient.mutate(Mutation_createPost, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						caption: "XSS Test Caption",
						body: htmlBody,
						organizationId: orgId,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.createPost?.body).toBe(
				"&lt;script&gt;alert(&#39;xss&#39;)&lt;/script&gt;&lt;img src=x onerror=alert(&#39;xss&#39;)&gt;",
			);
			// Verify HTML tags are properly escaped
			expect(result.data?.createPost?.body).not.toContain("<script>");
			expect(result.data?.createPost?.body).not.toContain("<img");
		});
	});
});

test("successfully creates post with valid image attachment", async () => {
	const { accessToken: token } = await getAdminAuthViaRest(server);
	assertToBeNonNullish(token);

	const createOrgResult = await mercuriusClient.mutate(
		Mutation_createOrganization,
		{
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					name: `TestOrg_${faker.string.ulid()}`,
					description: faker.lorem.sentence(),
				},
			},
		},
	);

	const orgId = createOrgResult.data.createOrganization?.id;
	assertToBeNonNullish(orgId);

	const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;

	const operations = JSON.stringify({
		query: `
      mutation Mutation_createPost($input: MutationCreatePostInput!) {
        createPost(input: $input) {
          id
          caption
          attachments { mimeType name }
        }
      }
    `,
		variables: {
			input: {
				caption: "Hello world",
				organizationId: orgId,
				isPinned: false,
				attachment: null,
			},
		},
	});

	const map = JSON.stringify({
		"0": ["variables.input.attachment"],
	});

	const fileContent = "fake jpeg content";

	const body = [
		`--${boundary}`,
		'Content-Disposition: form-data; name="operations"',
		"",
		operations,
		`--${boundary}`,
		'Content-Disposition: form-data; name="map"',
		"",
		map,
		`--${boundary}`,
		'Content-Disposition: form-data; name="0"; filename="post-photo.jpg"',
		"Content-Type: image/jpeg",
		"",
		fileContent,
		`--${boundary}--`,
	].join("\r\n");

	const response = await server.inject({
		method: "POST",
		url: "/graphql",
		headers: {
			"content-type": `multipart/form-data; boundary=${boundary}`,
			authorization: `bearer ${token}`,
		},
		payload: body,
	});

	const result = JSON.parse(response.body);

	expect(result.errors).toBeUndefined();
	assertToBeNonNullish(result.data.createPost?.id);

	expect(result.data.createPost.attachments).toHaveLength(1);
	expect(result.data.createPost.attachments[0].mimeType).toBe("image/jpeg");
});

test("returns unexpected error when MinIO upload fails", async () => {
	// Save original method for restoration
	const originalPutObject = server.minio.client.putObject;

	try {
		const { accessToken: token } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(token);

		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${token}` },
				variables: {
					input: {
						name: `TestOrg_${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
					},
				},
			},
		);

		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// mock MinIO failure
		server.minio.client.putObject = vi
			.fn()
			.mockRejectedValue(new Error("simulated failure"));

		const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;
		const operations = JSON.stringify({
			query: `
      mutation Mutation_createPost($input: MutationCreatePostInput!) {
        createPost(input: $input) {
          id
        }
      }
    `,
			variables: {
				input: {
					caption: "Test",
					organizationId: orgId,
					isPinned: false,
					attachment: null,
				},
			},
		});

		const map = JSON.stringify({
			"0": ["variables.input.attachment"],
		});

		const body = [
			`--${boundary}`,
			'Content-Disposition: form-data; name="operations"',
			"",
			operations,
			`--${boundary}`,
			'Content-Disposition: form-data; name="map"',
			"",
			map,
			`--${boundary}`,
			'Content-Disposition: form-data; name="0"; filename="photo.jpg"',
			"Content-Type: image/jpeg",
			"",
			"fakecontent",
			`--${boundary}--`,
		].join("\r\n");

		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			headers: {
				"content-type": `multipart/form-data; boundary=${boundary}`,
				authorization: `bearer ${token}`,
			},
			payload: body,
		});

		const result = JSON.parse(response.body);

		expect(result.data?.createPost).toEqual(null);

		// the resolver's exact error code
		expect(result.errors[0].extensions.code).toBe("unexpected");
	} finally {
		// Restore original method
		server.minio.client.putObject = originalPutObject;
	}
});

test("removes MinIO object and returns unexpected error when attachment DB insert fails", async () => {
	// Save original methods for restoration
	const originalTransaction = server.drizzleClient.transaction;
	const originalRemoveObject = server.minio.client.removeObject;
	const removeObjectSpy = vi.fn().mockResolvedValue(undefined);

	try {
		const { accessToken: token } = await getAdminAuthViaRest(server);
		assertToBeNonNullish(token);

		const createOrgResult = await mercuriusClient.mutate(
			Mutation_createOrganization,
			{
				headers: { authorization: `bearer ${token}` },
				variables: {
					input: {
						name: `TestOrg_${faker.string.ulid()}`,
						description: faker.lorem.sentence(),
					},
				},
			},
		);

		const orgId = createOrgResult.data?.createOrganization?.id;
		assertToBeNonNullish(orgId);

		// Mock removeObject to track calls
		server.minio.client.removeObject = removeObjectSpy;

		// Mock the transaction to succeed for post insert but fail for attachment insert
		let insertCallCount = 0;
		server.drizzleClient.transaction = vi
			.fn()
			.mockImplementation(async (callback) => {
				const mockTx = {
					insert: () => ({
						values: () => ({
							returning: async () => {
								insertCallCount++;
								// First call (post insert) succeeds, second call (attachment insert) returns empty array
								if (insertCallCount === 1) {
									return [
										{
											id: faker.string.uuid(),
											creatorId: faker.string.uuid(),
											caption: "Test",
											body: null,
											pinnedAt: null,
											organizationId: orgId,
											createdAt: new Date(),
											updatedAt: new Date(),
										},
									];
								}
								return []; // Attachment insert fails
							},
						}),
					}),
				};

				return await callback(mockTx);
			});

		const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;
		const operations = JSON.stringify({
			query: `
      mutation Mutation_createPost($input: MutationCreatePostInput!) {
        createPost(input: $input) {
          id
        }
      }
    `,
			variables: {
				input: {
					caption: "Test",
					organizationId: orgId,
					isPinned: false,
					attachment: null,
				},
			},
		});

		const map = JSON.stringify({
			"0": ["variables.input.attachment"],
		});

		const body = [
			`--${boundary}`,
			'Content-Disposition: form-data; name="operations"',
			"",
			operations,
			`--${boundary}`,
			'Content-Disposition: form-data; name="map"',
			"",
			map,
			`--${boundary}`,
			'Content-Disposition: form-data; name="0"; filename="photo.jpg"',
			"Content-Type: image/jpeg",
			"",
			"fakecontent",
			`--${boundary}--`,
		].join("\r\n");

		const response = await server.inject({
			method: "POST",
			url: "/graphql",
			headers: {
				"content-type": `multipart/form-data; boundary=${boundary}`,
				authorization: `bearer ${token}`,
			},
			payload: body,
		});

		const result = JSON.parse(response.body);

		// Verify error response
		expect(result.data?.createPost).toEqual(null);
		expect(result.errors[0].extensions.code).toBe("unexpected");

		// Verify removeObject was called to cleanup the MinIO object
		expect(removeObjectSpy).toHaveBeenCalledTimes(1);
		expect(removeObjectSpy).toHaveBeenCalledWith(
			server.minio.bucketName,
			expect.any(String),
		);
	} finally {
		// Restore original methods
		server.drizzleClient.transaction = originalTransaction;
		server.minio.client.removeObject = originalRemoveObject;
	}
});
