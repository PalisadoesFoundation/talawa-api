import { faker } from "@faker-js/faker";
import type { Client } from "minio";
import { afterEach, expect, suite, test, vi } from "vitest";
import type {
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionExtensions,
	UnexpectedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_deleteCurrentUser,
	Mutation_deleteUser,
	Mutation_updateCommunity,
	Query_signIn,
} from "../documentNodes";

// Extract the return type of putObject from the minio Client
type UploadedObjectInfo = Awaited<ReturnType<Client["putObject"]>>;

// Get admin auth token at module level
const signInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});
assertToBeNonNullish(signInResult.data?.signIn);
const adminAuthToken = signInResult.data.signIn.authenticationToken;
assertToBeNonNullish(adminAuthToken);

suite("Mutation field updateCommunity", () => {
	const testCleanupFunctions: Array<() => Promise<void>> = [];

	afterEach(async () => {
		vi.restoreAllMocks();

		let firstError: unknown;
		while (testCleanupFunctions.length > 0) {
			const cleanup = testCleanupFunctions.pop();
			if (!cleanup) {
				continue;
			}

			try {
				await cleanup();
			} catch (error) {
				console.error("Cleanup failed:", error);
				firstError ??= error;
			}
		}

		if (firstError !== undefined) {
			throw firstError;
		}
	});

	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.updateCommunity" field if`,
		() => {
			test("client triggering the graphql operation is not authenticated.", async () => {
				const result = await mercuriusClient.mutate(Mutation_updateCommunity, {
					variables: {
						input: {
							name: "Updated Community Name",
						},
					},
				});

				expect(result.data?.updateCommunity).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["updateCommunity"],
						}),
					]),
				);
			});

			test("client triggering the graphql operation has no existing user associated to their authentication context.", async () => {
				const { authToken: userToken } = await createRegularUserUsingAdmin();
				assertToBeNonNullish(userToken);

				// Delete the user using the admin
				await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
					headers: { authorization: `bearer ${userToken}` },
				});

				const result = await mercuriusClient.mutate(Mutation_updateCommunity, {
					headers: {
						authorization: `bearer ${userToken}`,
					},
					variables: {
						input: {
							name: "Updated by deleted user",
						},
					},
				});

				expect(result.data?.updateCommunity).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["updateCommunity"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "unauthorized_action" extensions code in the "errors" field and "null" as the value of "data.updateCommunity" field if`,
		() => {
			test("client triggering the graphql operation is not an administrator.", async () => {
				const { authToken: regularAuthToken, userId: regularUserId } =
					await createRegularUserUsingAdmin();
				assertToBeNonNullish(regularAuthToken);
				assertToBeNonNullish(regularUserId);

				// Add cleanup for the regular user
				testCleanupFunctions.push(async () => {
					await mercuriusClient.mutate(Mutation_deleteUser, {
						headers: { authorization: `bearer ${adminAuthToken}` },
						variables: { input: { id: regularUserId } },
					});
				});

				const result = await mercuriusClient.mutate(Mutation_updateCommunity, {
					headers: {
						authorization: `bearer ${regularAuthToken}`,
					},
					variables: {
						input: {
							name: "Updated by regular user",
						},
					},
				});

				expect(result.data?.updateCommunity).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthorizedActionExtensions>(
								{
									code: "unauthorized_action",
								},
							),
							message: expect.any(String),
							path: ["updateCommunity"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in a graphql error with "invalid_arguments" extensions code in the "errors" field and "null" as the value of "data.updateCommunity" field if`,
		() => {
			test("at least one optional argument within the 'input' argument is not provided.", async () => {
				const result = await mercuriusClient.mutate(Mutation_updateCommunity, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {},
					},
				});

				expect(result.data?.updateCommunity).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining<
									InvalidArgumentsExtensions["issues"]
								>([
									expect.objectContaining<
										InvalidArgumentsExtensions["issues"][number]
									>({
										argumentPath: ["input"],
										message: expect.any(String),
									}),
								]),
							}),
							message: expect.any(String),
							path: ["updateCommunity"],
						}),
					]),
				);
			});

			test("logo has invalid mime type", async () => {
				const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;

				const operations = JSON.stringify({
					query: `
					mutation Mutation_updateCommunity($input: MutationUpdateCommunityInput!) {
						updateCommunity(input: $input) {
							id
							logoMimeType
						}
					}
					`,
					variables: {
						input: {
							logo: null,
						},
					},
				});

				const map = JSON.stringify({
					"0": ["variables.input.logo"],
				});

				const fileContent = "fake content";

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
					'Content-Disposition: form-data; name="0"; filename="test.txt"',
					"Content-Type: text/plain",
					"",
					fileContent,
					`--${boundary}--`,
				].join("\r\n");

				const response = await server.inject({
					method: "POST",
					url: "/graphql",
					headers: {
						"content-type": `multipart/form-data; boundary=${boundary}`,
						authorization: `bearer ${adminAuthToken}`,
					},
					payload: body,
				});

				const result = JSON.parse(response.body);

				expect(result.data?.updateCommunity).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "logo"],
										message: expect.stringContaining("text/plain"),
									}),
								]),
							}),
							path: ["updateCommunity"],
						}),
					]),
				);
			});

			test("URL fields have invalid URL format", async () => {
				const result = await mercuriusClient.mutate(Mutation_updateCommunity, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							facebookURL: "not-a-valid-url",
						},
					},
				});

				expect(result.data?.updateCommunity).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "facebookURL"],
										message: expect.any(String),
									}),
								]),
							}),
							message: expect.any(String),
							path: ["updateCommunity"],
						}),
					]),
				);
			});
		},
	);

	suite(
		`results in "undefined" as the value of "errors" field and the expected value for the "data.updateCommunity" field where`,
		() => {
			test("community fields are updated successfully without logo.", async () => {
				const updatedName = `Updated Community ${faker.string.ulid()}`;
				const result = await mercuriusClient.mutate(Mutation_updateCommunity, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							name: updatedName,
							facebookURL: "https://facebook.com/test",
							githubURL: "https://github.com/test",
							instagramURL: "https://instagram.com/test",
							linkedinURL: "https://linkedin.com/test",
							redditURL: "https://reddit.com/test",
							slackURL: "https://slack.com/test",
							websiteURL: "https://example.com",
							xURL: "https://x.com/test",
							youtubeURL: "https://youtube.com/test",
							inactivityTimeoutDuration: 3600,
						},
					},
				});

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateCommunity).toEqual(
					expect.objectContaining({
						id: expect.any(String),
						name: updatedName,
						facebookURL: "https://facebook.com/test",
						githubURL: "https://github.com/test",
						instagramURL: "https://instagram.com/test",
						linkedinURL: "https://linkedin.com/test",
						redditURL: "https://reddit.com/test",
						slackURL: "https://slack.com/test",
						websiteURL: "https://example.com",
						xURL: "https://x.com/test",
						youtubeURL: "https://youtube.com/test",
						inactivityTimeoutDuration: 3600,
					}),
				);
			});

			test("community is updated with a new logo (no existing logo).", async () => {
				// First, ensure community has no logo by setting it to null
				await mercuriusClient.mutate(Mutation_updateCommunity, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							logo: null,
						},
					},
				});

				// Mock minio putObject
				const putObjectSpy = vi
					.spyOn(server.minio.client, "putObject")
					.mockResolvedValue({ etag: "mock-etag" } as UploadedObjectInfo);

				const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;

				const operations = JSON.stringify({
					query: `
					mutation Mutation_updateCommunity($input: MutationUpdateCommunityInput!) {
						updateCommunity(input: $input) {
							id
							name
							logoMimeType
						}
					}
					`,
					variables: {
						input: {
							logo: null,
						},
					},
				});

				const map = JSON.stringify({
					"0": ["variables.input.logo"],
				});

				const fileContent = "test image content";

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
					'Content-Disposition: form-data; name="0"; filename="logo.png"',
					"Content-Type: image/png",
					"",
					fileContent,
					`--${boundary}--`,
				].join("\r\n");

				const response = await server.inject({
					method: "POST",
					url: "/graphql",
					headers: {
						"content-type": `multipart/form-data; boundary=${boundary}`,
						authorization: `bearer ${adminAuthToken}`,
					},
					payload: body,
				});

				const result = JSON.parse(response.body);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateCommunity).toEqual(
					expect.objectContaining({
						id: expect.any(String),
						logoMimeType: "image/png",
					}),
				);
				expect(putObjectSpy).toHaveBeenCalled();
			});

			test("community is updated with a new logo (existing logo present - reuses logoName).", async () => {
				// First, upload an initial logo
				const initialPutObjectSpy = vi
					.spyOn(server.minio.client, "putObject")
					.mockResolvedValue({ etag: "mock-etag" } as UploadedObjectInfo);

				const initialBoundary = `----WebKitFormBoundary${Math.random().toString(36)}`;

				const initialOperations = JSON.stringify({
					query: `
					mutation Mutation_updateCommunity($input: MutationUpdateCommunityInput!) {
						updateCommunity(input: $input) {
							id
							logoMimeType
						}
					}
					`,
					variables: {
						input: {
							logo: null,
						},
					},
				});

				const initialMap = JSON.stringify({
					"0": ["variables.input.logo"],
				});

				const initialBody = [
					`--${initialBoundary}`,
					'Content-Disposition: form-data; name="operations"',
					"",
					initialOperations,
					`--${initialBoundary}`,
					'Content-Disposition: form-data; name="map"',
					"",
					initialMap,
					`--${initialBoundary}`,
					'Content-Disposition: form-data; name="0"; filename="initial.jpg"',
					"Content-Type: image/jpeg",
					"",
					"initial content",
					`--${initialBoundary}--`,
				].join("\r\n");

				await server.inject({
					method: "POST",
					url: "/graphql",
					headers: {
						"content-type": `multipart/form-data; boundary=${initialBoundary}`,
						authorization: `bearer ${adminAuthToken}`,
					},
					payload: initialBody,
				});

				expect(initialPutObjectSpy).toHaveBeenCalled();
				vi.restoreAllMocks();

				// Now upload a new logo (should reuse existing logoName)
				const putObjectSpy = vi
					.spyOn(server.minio.client, "putObject")
					.mockResolvedValue({ etag: "mock-etag-2" } as UploadedObjectInfo);

				const boundary = `----WebKitFormBoundary${Math.random().toString(36)}`;

				const operations = JSON.stringify({
					query: `
					mutation Mutation_updateCommunity($input: MutationUpdateCommunityInput!) {
						updateCommunity(input: $input) {
							id
							logoMimeType
						}
					}
					`,
					variables: {
						input: {
							logo: null,
						},
					},
				});

				const map = JSON.stringify({
					"0": ["variables.input.logo"],
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
					'Content-Disposition: form-data; name="0"; filename="new-logo.webp"',
					"Content-Type: image/webp",
					"",
					"new content",
					`--${boundary}--`,
				].join("\r\n");

				const response = await server.inject({
					method: "POST",
					url: "/graphql",
					headers: {
						"content-type": `multipart/form-data; boundary=${boundary}`,
						authorization: `bearer ${adminAuthToken}`,
					},
					payload: body,
				});

				const result = JSON.parse(response.body);

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateCommunity).toEqual(
					expect.objectContaining({
						id: expect.any(String),
						logoMimeType: "image/webp",
					}),
				);
				expect(putObjectSpy).toHaveBeenCalled();
			});

			test("community logo is removed when logo is set to null (existing logo is removed from minio).", async () => {
				// First, ensure there's a logo
				const putObjectSpy = vi
					.spyOn(server.minio.client, "putObject")
					.mockResolvedValue({ etag: "mock-etag" } as UploadedObjectInfo);

				const uploadBoundary = `----WebKitFormBoundary${Math.random().toString(36)}`;

				const uploadOperations = JSON.stringify({
					query: `
					mutation Mutation_updateCommunity($input: MutationUpdateCommunityInput!) {
						updateCommunity(input: $input) {
							id
							logoMimeType
						}
					}
					`,
					variables: {
						input: {
							logo: null,
						},
					},
				});

				const uploadMap = JSON.stringify({
					"0": ["variables.input.logo"],
				});

				const uploadBody = [
					`--${uploadBoundary}`,
					'Content-Disposition: form-data; name="operations"',
					"",
					uploadOperations,
					`--${uploadBoundary}`,
					'Content-Disposition: form-data; name="map"',
					"",
					uploadMap,
					`--${uploadBoundary}`,
					'Content-Disposition: form-data; name="0"; filename="logo.png"',
					"Content-Type: image/png",
					"",
					"logo content",
					`--${uploadBoundary}--`,
				].join("\r\n");

				const uploadResponse = await server.inject({
					method: "POST",
					url: "/graphql",
					headers: {
						"content-type": `multipart/form-data; boundary=${uploadBoundary}`,
						authorization: `bearer ${adminAuthToken}`,
					},
					payload: uploadBody,
				});

				const uploadResult = JSON.parse(uploadResponse.body);
				expect(uploadResult.errors).toBeUndefined();
				expect(uploadResult.data?.updateCommunity?.logoMimeType).toBe(
					"image/png",
				);
				expect(putObjectSpy).toHaveBeenCalled();

				// Now remove the logo
				const removeObjectSpy = vi
					.spyOn(server.minio.client, "removeObject")
					.mockResolvedValue();

				const removeResult = await mercuriusClient.mutate(
					Mutation_updateCommunity,
					{
						headers: {
							authorization: `bearer ${adminAuthToken}`,
						},
						variables: {
							input: {
								logo: null,
							},
						},
					},
				);

				expect(removeResult.errors).toBeUndefined();
				expect(removeResult.data?.updateCommunity).toEqual(
					expect.objectContaining({
						id: expect.any(String),
						logoMimeType: null,
					}),
				);
				expect(removeObjectSpy).toHaveBeenCalled();
			});

			test("community social URLs can be set to null.", async () => {
				// First set some social URLs
				await mercuriusClient.mutate(Mutation_updateCommunity, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							facebookURL: "https://facebook.com/test",
							githubURL: "https://github.com/test",
						},
					},
				});

				// Now set them to null
				const result = await mercuriusClient.mutate(Mutation_updateCommunity, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							facebookURL: null,
							githubURL: null,
						},
					},
				});

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateCommunity).toEqual(
					expect.objectContaining({
						id: expect.any(String),
						facebookURL: null,
						githubURL: null,
					}),
				);
			});

			test("community inactivityTimeoutDuration can be updated.", async () => {
				const newTimeout = 7200;
				const result = await mercuriusClient.mutate(Mutation_updateCommunity, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							inactivityTimeoutDuration: newTimeout,
						},
					},
				});

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateCommunity).toEqual(
					expect.objectContaining({
						id: expect.any(String),
						inactivityTimeoutDuration: newTimeout,
					}),
				);
			});
		},
	);

	suite("Edge cases and error handling", () => {
		test("should handle 'unexpected' error when community does not exist in database", async () => {
			// This test simulates a corrupted database state where the community table is empty
			// We mock the drizzleClient query to return undefined for the community
			const originalFindFirst =
				server.drizzleClient.query.communitiesTable.findFirst;
			vi.spyOn(
				server.drizzleClient.query.communitiesTable,
				"findFirst",
			).mockResolvedValue(undefined);

			const result = await mercuriusClient.mutate(Mutation_updateCommunity, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						name: "New Name",
					},
				},
			});

			expect(result.data?.updateCommunity).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnexpectedExtensions>({
							code: "unexpected",
						}),
						message: expect.any(String),
						path: ["updateCommunity"],
					}),
				]),
			);

			// Restore original implementation
			vi.spyOn(
				server.drizzleClient.query.communitiesTable,
				"findFirst",
			).mockImplementation(originalFindFirst);
		});

		test("should handle 'unexpected' error when update returns undefined", async () => {
			// Mock the transaction to return undefined for the update
			const originalTransaction = server.drizzleClient.transaction;
			vi.spyOn(server.drizzleClient, "transaction").mockImplementation(
				async (callback) => {
					const mockTx = {
						update: () => ({
							set: () => ({
								returning: async () => [],
							}),
						}),
					};
					return callback(mockTx as never);
				},
			);

			const result = await mercuriusClient.mutate(Mutation_updateCommunity, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						name: "New Name",
					},
				},
			});

			expect(result.data?.updateCommunity).toEqual(null);
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnexpectedExtensions>({
							code: "unexpected",
						}),
						message: expect.any(String),
						path: ["updateCommunity"],
					}),
				]),
			);

			// Restore original implementation
			vi.spyOn(server.drizzleClient, "transaction").mockImplementation(
				originalTransaction,
			);
		});
	});
});
