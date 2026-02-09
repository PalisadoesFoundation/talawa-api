import { faker } from "@faker-js/faker";
import { initGraphQLTada } from "gql.tada";
import type { Client } from "minio";
import { afterEach, expect, suite, test, vi } from "vitest";
import type { ClientCustomScalars } from "~/src/graphql/scalars/index";
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
import type { introspection } from "../gql.tada";

const gql = initGraphQLTada<{
	introspection: introspection;
	scalars: ClientCustomScalars;
}>();

export const Mutation_updateCommunity = gql(`
	mutation Mutation_updateCommunity($input: MutationUpdateCommunityInput!) {
		updateCommunity(input: $input) {
			id
			name
			facebookURL
			githubURL
			instagramURL
			linkedinURL
			logoMimeType
			redditURL
			slackURL
			websiteURL
			xURL
			youtubeURL
			inactivityTimeoutDuration
		}
	}
`);

import {
	Mutation_deleteCurrentUser,
	Mutation_deleteUser,
	Query_signIn,
} from "../documentNodes";

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
				// Try to update community with invalid MIME type for logo
				const result = await mercuriusClient.mutate(Mutation_updateCommunity, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							logo: {
								objectName: faker.string.ulid(),
								mimeType: "text/plain" as never,
								fileHash: faker.string.hexadecimal({
									length: 64,
									casing: "lower",
									prefix: "",
								}),
								name: "test.txt",
							},
						},
					},
				});

				expect(result.data?.updateCommunity).toBeUndefined();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "invalid_arguments",
							}),
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
							// Need to provide at least one field
							name: `Community_${faker.string.ulid()}`,
						},
					},
				});

				const objectName = faker.string.ulid();

				// Mock statObject to simulate file exists in MinIO
				const statObjectSpy = vi
					.spyOn(server.minio.client, "statObject")
					.mockResolvedValue({} as Awaited<ReturnType<Client["statObject"]>>);

				const result = await mercuriusClient.mutate(Mutation_updateCommunity, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							name: `Community_${faker.string.ulid()}`,
							logo: {
								objectName: objectName,
								mimeType: "IMAGE_PNG",
								fileHash: faker.string.hexadecimal({
									length: 64,
									casing: "lower",
									prefix: "",
								}),
								name: "logo.png",
							},
						},
					},
				});

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateCommunity).toEqual(
					expect.objectContaining({
						id: expect.any(String),
						logoMimeType: "image/png",
					}),
				);
				expect(statObjectSpy).toHaveBeenCalled();
			});

			test("community is updated with a new logo (existing logo present - uses new objectName).", async () => {
				// First, set an initial logo
				const initialObjectName = faker.string.ulid();
				const statObjectSpy = vi
					.spyOn(server.minio.client, "statObject")
					.mockResolvedValue({} as Awaited<ReturnType<Client["statObject"]>>);

				await mercuriusClient.mutate(Mutation_updateCommunity, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							name: `Community_${faker.string.ulid()}`,
							logo: {
								objectName: initialObjectName,
								mimeType: "IMAGE_JPEG",
								fileHash: faker.string.hexadecimal({
									length: 64,
									casing: "lower",
									prefix: "",
								}),
								name: "initial.jpg",
							},
						},
					},
				});

				expect(statObjectSpy).toHaveBeenCalled();
				statObjectSpy.mockRestore();

				// Now upload a new logo with different objectName
				const newObjectName = faker.string.ulid();
				const newStatObjectSpy = vi
					.spyOn(server.minio.client, "statObject")
					.mockResolvedValue({} as Awaited<ReturnType<Client["statObject"]>>);
				const removeObjectSpy = vi
					.spyOn(server.minio.client, "removeObject")
					.mockResolvedValue();

				const result = await mercuriusClient.mutate(Mutation_updateCommunity, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							name: `Community_${faker.string.ulid()}`,
							logo: {
								objectName: newObjectName,
								mimeType: "IMAGE_WEBP",
								fileHash: faker.string.hexadecimal({
									length: 64,
									casing: "lower",
									prefix: "",
								}),
								name: "new-logo.webp",
							},
						},
					},
				});

				expect(result.errors).toBeUndefined();
				expect(result.data?.updateCommunity).toEqual(
					expect.objectContaining({
						id: expect.any(String),
						logoMimeType: "image/webp",
					}),
				);
				expect(newStatObjectSpy).toHaveBeenCalled();
				// Old logo should be removed
				expect(removeObjectSpy).toHaveBeenCalled();
			});

			test("community logo is removed when logo is set to null (existing logo is removed from minio).", async () => {
				// First, ensure there's a logo by setting one
				const objectName = faker.string.ulid();
				const statObjectSpy = vi
					.spyOn(server.minio.client, "statObject")
					.mockResolvedValue({} as Awaited<ReturnType<Client["statObject"]>>);

				const uploadResult = await mercuriusClient.mutate(
					Mutation_updateCommunity,
					{
						headers: {
							authorization: `bearer ${adminAuthToken}`,
						},
						variables: {
							input: {
								logo: {
									objectName: objectName,
									mimeType: "IMAGE_PNG",
									fileHash: faker.string.hexadecimal({
										length: 64,
										casing: "lower",
										prefix: "",
									}),
									name: "logo.png",
								},
							},
						},
					},
				);

				expect(uploadResult.errors).toBeUndefined();
				expect(uploadResult.data?.updateCommunity?.logoMimeType).toBe(
					"image/png",
				);
				expect(statObjectSpy).toHaveBeenCalled();
				statObjectSpy.mockRestore();

				// Now remove the logo by setting it to null
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
		});

		test("should handle 'unexpected' error when update returns undefined", async () => {
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
		});

		test("should reject logo with invalid MIME type", async () => {
			// This tests the MIME type validation in updateCommunity.ts
			// VIDEO_MP4 is valid for schema but NOT allowed for logo (must be image type)
			const objectName = `test-logo-${faker.string.uuid()}`;
			const result = await mercuriusClient.mutate(Mutation_updateCommunity, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						logo: {
							objectName: objectName,
							mimeType: "VIDEO_MP4", // Valid for schema, invalid for logo
							fileHash: "a".repeat(64),
							name: "logo.mp4",
						},
					},
				},
			});

			expect(result.data?.updateCommunity).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<InvalidArgumentsExtensions>({
							code: "invalid_arguments",
							issues: expect.any(Array),
						}),
						message: expect.any(String),
						path: ["updateCommunity"],
					}),
				]),
			);
		});

		test("should return invalid_arguments when logo file not found in MinIO", async () => {
			const objectName = `non-existent-${faker.string.uuid()}`;
			// Mock statObject to throw NotFound error
			const statObjectSpy = vi
				.spyOn(server.minio.client, "statObject")
				.mockRejectedValue(
					Object.assign(new Error("Not Found"), { code: "NotFound" }),
				);

			try {
				const result = await mercuriusClient.mutate(Mutation_updateCommunity, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							logo: {
								objectName: objectName,
								mimeType: "IMAGE_PNG",
								fileHash: "a".repeat(64),
								name: "logo.png",
							},
						},
					},
				});

				expect(result.data?.updateCommunity).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.any(Array),
							}),
							message: expect.any(String),
							path: ["updateCommunity"],
						}),
					]),
				);
				expect(statObjectSpy).toHaveBeenCalled();
			} finally {
				statObjectSpy.mockRestore();
			}
		});

		test("should return unexpected error when statObject fails with non-NotFound error", async () => {
			const objectName = `some-logo-${faker.string.uuid()}`;
			// Mock statObject to throw a non-NotFound error (e.g., network error)
			const statObjectSpy = vi
				.spyOn(server.minio.client, "statObject")
				.mockRejectedValue(new Error("Network connection failed"));

			try {
				const result = await mercuriusClient.mutate(Mutation_updateCommunity, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							logo: {
								objectName: objectName,
								mimeType: "IMAGE_PNG",
								fileHash: "a".repeat(64),
								name: "logo.png",
							},
						},
					},
				});

				expect(result.data?.updateCommunity).toBeNull();
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
				expect(statObjectSpy).toHaveBeenCalled();
			} finally {
				statObjectSpy.mockRestore();
			}
		});

		test("should succeed when old logo removal fails during update", async () => {
			// First, set up a community with a logo
			const objectName = `logos/${faker.string.uuid()}.png`;
			const fileContent = Buffer.from("fake image content");
			await server.minio.client.putObject(
				server.minio.bucketName,
				objectName,
				fileContent,
				fileContent.length,
				{ "content-type": "image/png" },
			);

			// Now mock removeObject to fail and statObject to succeed for new logo
			const newObjectName = `logos/${faker.string.uuid()}.jpg`;
			await server.minio.client.putObject(
				server.minio.bucketName,
				newObjectName,
				fileContent,
				fileContent.length,
				{ "content-type": "image/jpeg" },
			);

			// Update community with initial logo
			await mercuriusClient.mutate(Mutation_updateCommunity, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						logo: {
							objectName: objectName,
							mimeType: "IMAGE_PNG",
							fileHash: "a".repeat(64),
							name: "initial-logo.png",
						},
					},
				},
			});

			const removeObjectSpy = vi
				.spyOn(server.minio.client, "removeObject")
				.mockRejectedValue(new Error("Failed to delete object"));

			try {
				// Update with new logo - old logo removal should fail but update should succeed
				const result = await mercuriusClient.mutate(Mutation_updateCommunity, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							logo: {
								objectName: newObjectName,
								mimeType: "IMAGE_JPEG",
								fileHash: "a".repeat(64),
								name: "new-logo.jpg",
							},
						},
					},
				});

				// Key assertion: update succeeds even though removeObject failed
				expect(result.errors).toBeUndefined();
				expect(result.data?.updateCommunity).toBeDefined();
			} finally {
				removeObjectSpy.mockRestore();
				// Cleanup: remove uploaded MinIO objects
				try {
					await server.minio.client.removeObject(
						server.minio.bucketName,
						objectName,
					);
					await server.minio.client.removeObject(
						server.minio.bucketName,
						newObjectName,
					);
				} catch {
					// Intentional: cleanup errors are non-critical and should not fail the test
					void 0;
				}
			}
		});

		test("should succeed when logo removal fails during null assignment", async () => {
			// First, set up a community with a logo
			const objectName = `logos/${faker.string.uuid()}.png`;
			const fileContent = Buffer.from("fake image content");
			await server.minio.client.putObject(
				server.minio.bucketName,
				objectName,
				fileContent,
				fileContent.length,
				{ "content-type": "image/png" },
			);

			// Update community with logo
			await mercuriusClient.mutate(Mutation_updateCommunity, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						logo: {
							objectName: objectName,
							mimeType: "IMAGE_PNG",
							fileHash: "a".repeat(64),
							name: "logo-to-remove.png",
						},
					},
				},
			});

			// Mock removeObject to fail
			const removeObjectSpy = vi
				.spyOn(server.minio.client, "removeObject")
				.mockRejectedValue(new Error("Failed to delete object"));

			try {
				// Set logo to null - removal should fail but update should succeed
				const result = await mercuriusClient.mutate(Mutation_updateCommunity, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							logo: null,
						},
					},
				});

				// Key assertion: update succeeds even though removeObject failed
				expect(result.errors).toBeUndefined();
				expect(result.data?.updateCommunity).toBeDefined();
			} finally {
				removeObjectSpy.mockRestore();
				// Cleanup: remove uploaded MinIO object
				try {
					await server.minio.client.removeObject(
						server.minio.bucketName,
						objectName,
					);
				} catch {
					// Intentional: cleanup errors are non-critical and should not fail the test
					void 0;
				}
			}
		});
	});
});
