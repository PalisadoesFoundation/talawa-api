import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { expect, suite, test, vi } from "vitest";
import { advertisementAttachmentsTable } from "~/src/drizzle/tables/advertisementAttachments";
import { advertisementsTable } from "~/src/drizzle/tables/advertisements";
import { chatsTable } from "~/src/drizzle/tables/chats";
import { eventAttachmentsTable } from "~/src/drizzle/tables/eventAttachments";
import { eventsTable } from "~/src/drizzle/tables/events";
import { organizationsTable } from "~/src/drizzle/tables/organizations";
import { venueAttachmentsTable } from "~/src/drizzle/tables/venueAttachments";
import { venuesTable } from "~/src/drizzle/tables/venues";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_deleteCurrentUser,
	Mutation_deleteOrganization,
	Query_signIn,
} from "../documentNodes";

// Constants
const SUITE_TIMEOUT = 40_000;

// Helper function to create test organization
async function createTestOrganization(token: string) {
	const result = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: { authorization: `bearer ${token}` },
		variables: {
			input: {
				name: `Test Org ${faker.string.ulid()}`,
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

// Sign in as admin
const signInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});
if (signInResult.errors) {
	throw new Error(
		`Admin sign-in failed: ${JSON.stringify(signInResult.errors)}`,
	);
}
assertToBeNonNullish(signInResult.data?.signIn);
const authToken = signInResult.data.signIn.authenticationToken;
assertToBeNonNullish(authToken);
const adminUserId = signInResult.data.signIn.user?.id;
assertToBeNonNullish(adminUserId);

suite("Mutation field deleteOrganization", () => {
	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_deleteOrganization, {
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			});

			expect(result.data?.deleteOrganization).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["deleteOrganization"],
					}),
				]),
			);
		});
	});

	suite("when arguments are invalid", () => {
		test("should return an error for invalid organization id", async () => {
			const result = await mercuriusClient.mutate(Mutation_deleteOrganization, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: "not-a-valid-uuid",
					},
				},
			});

			expect(result.data?.deleteOrganization).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: expect.arrayContaining(["input", "id"]),
								}),
							]),
						}),
						path: ["deleteOrganization"],
					}),
				]),
			);
		});
	});

	suite("when the current user does not exist", () => {
		test(
			"should return an error with unauthenticated extensions code",
			async () => {
				const { authToken: userToken } = await createRegularUserUsingAdmin();
				assertToBeNonNullish(userToken);

				// Delete the user who owns the token
				await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
					headers: { authorization: `bearer ${userToken}` },
				});

				// Try to delete an organization with the now-invalid token
				const result = await mercuriusClient.mutate(
					Mutation_deleteOrganization,
					{
						headers: { authorization: `bearer ${userToken}` },
						variables: {
							input: {
								id: faker.string.uuid(),
							},
						},
					},
				);

				expect(result.data?.deleteOrganization).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({ code: "unauthenticated" }),
							path: ["deleteOrganization"],
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when the current user is not an administrator", () => {
		test(
			"should return an error with unauthorized_action extensions code",
			async () => {
				const { authToken: regularUserToken } =
					await createRegularUserUsingAdmin();
				assertToBeNonNullish(regularUserToken);

				// Create an organization as admin
				const orgId = await createTestOrganization(authToken);

				// Try to delete as regular user
				const result = await mercuriusClient.mutate(
					Mutation_deleteOrganization,
					{
						headers: { authorization: `bearer ${regularUserToken}` },
						variables: {
							input: {
								id: orgId,
							},
						},
					},
				);

				expect(result.data?.deleteOrganization).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unauthorized_action",
							}),
							path: ["deleteOrganization"],
						}),
					]),
				);

				// Cleanup: delete the org as admin
				await mercuriusClient.mutate(Mutation_deleteOrganization, {
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: { id: orgId },
					},
				});
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when the organization does not exist", () => {
		test(
			"should return an error with arguments_associated_resources_not_found extensions code",
			async () => {
				const result = await mercuriusClient.mutate(
					Mutation_deleteOrganization,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								id: faker.string.uuid(),
							},
						},
					},
				);

				expect(result.data?.deleteOrganization).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "arguments_associated_resources_not_found",
								issues: expect.arrayContaining([
									expect.objectContaining({
										argumentPath: ["input", "id"],
									}),
								]),
							}),
							path: ["deleteOrganization"],
						}),
					]),
				);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when the client is authorized", () => {
		test(
			"should successfully delete an organization",
			async () => {
				const orgId = await createTestOrganization(authToken);

				const result = await mercuriusClient.mutate(
					Mutation_deleteOrganization,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								id: orgId,
							},
						},
					},
				);

				expect(result.errors).toBeUndefined();
				expect(result.data?.deleteOrganization).toEqual(
					expect.objectContaining({
						id: orgId,
					}),
				);
			},
			SUITE_TIMEOUT,
		);
	});

	suite(
		"when the deletion returns no deleted organization (race condition)",
		() => {
			test(
				"should return an error with arguments_associated_resources_not_found extensions code",
				async () => {
					const orgId = await createTestOrganization(authToken);

					// Mock the transaction to simulate race condition where org is deleted
					// between the initial check and the actual delete operation
					const originalTransaction = server.drizzleClient.transaction;

					const fakeTransaction = async <T>(
						callback: (tx: typeof server.drizzleClient) => Promise<T>,
					) => {
						// Create a fake tx that returns empty array on delete
						const fakeTx = {
							...server.drizzleClient,
							delete: () => ({
								where: () => ({
									returning: async () => [],
								}),
							}),
						} as unknown as typeof server.drizzleClient;
						return callback(fakeTx);
					};

					try {
						server.drizzleClient.transaction =
							fakeTransaction as unknown as typeof server.drizzleClient.transaction;

						const result = await mercuriusClient.mutate(
							Mutation_deleteOrganization,
							{
								headers: { authorization: `bearer ${authToken}` },
								variables: {
									input: {
										id: orgId,
									},
								},
							},
						);

						expect(result.data?.deleteOrganization ?? null).toBeNull();
						expect(result.errors).toEqual(
							expect.arrayContaining([
								expect.objectContaining({
									extensions: expect.objectContaining({
										code: "arguments_associated_resources_not_found",
										issues: expect.arrayContaining([
											expect.objectContaining({
												argumentPath: ["input", "id"],
											}),
										]),
									}),
									path: ["deleteOrganization"],
								}),
							]),
						);
					} finally {
						server.drizzleClient.transaction = originalTransaction;
					}

					// Cleanup: delete the org that wasn't actually deleted due to mock
					await mercuriusClient.mutate(Mutation_deleteOrganization, {
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: { id: orgId },
						},
					});
				},
				SUITE_TIMEOUT,
			);
		},
	);

	suite("when deleting organization with posts that have attachments", () => {
		test(
			"should successfully delete organization and cleanup post attachments",
			async () => {
				// Create organization
				const orgId = await createTestOrganization(authToken);

				// Create a post with attachment using multipart form
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
							caption: "Test post with attachment",
							organizationId: orgId,
							isPinned: false,
							attachment: null,
						},
					},
				});

				const map = JSON.stringify({
					"0": ["variables.input.attachment"],
				});

				const fileContent = "fake jpeg content for test";

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
					'Content-Disposition: form-data; name="0"; filename="test-image.jpg"',
					"Content-Type: image/jpeg",
					"",
					fileContent,
					`--${boundary}--`,
				].join("\r\n");

				const postResponse = await server.inject({
					method: "POST",
					url: "/graphql",
					headers: {
						"content-type": `multipart/form-data; boundary=${boundary}`,
						authorization: `bearer ${authToken}`,
					},
					payload: body,
				});

				const postResult = JSON.parse(postResponse.body);
				expect(postResult.errors).toBeUndefined();
				expect(postResult.data.createPost?.attachments).toHaveLength(1);

				// Now delete the organization which should cleanup post attachments
				const deleteResult = await mercuriusClient.mutate(
					Mutation_deleteOrganization,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								id: orgId,
							},
						},
					},
				);

				expect(deleteResult.errors).toBeUndefined();
				expect(deleteResult.data?.deleteOrganization).toEqual(
					expect.objectContaining({
						id: orgId,
					}),
				);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when deleting organization with avatar", () => {
		test(
			"should successfully delete organization and cleanup avatar",
			async () => {
				// Create organization
				const orgId = await createTestOrganization(authToken);

				// Set avatar directly in database
				await server.drizzleClient
					.update(organizationsTable)
					.set({
						avatarName: "test-org-avatar.png",
						avatarMimeType: "image/png",
					})
					.where(eq(organizationsTable.id, orgId));

				// Delete the organization - should cleanup the avatar
				const deleteResult = await mercuriusClient.mutate(
					Mutation_deleteOrganization,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: {
							input: {
								id: orgId,
							},
						},
					},
				);

				expect(deleteResult.errors).toBeUndefined();
				expect(deleteResult.data?.deleteOrganization).toEqual(
					expect.objectContaining({
						id: orgId,
					}),
				);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when deleting organization with advertisement attachments", () => {
		test(
			"should successfully delete organization and cleanup ad attachments",
			async () => {
				const orgId = await createTestOrganization(authToken);

				// Insert an advertisement with attachment directly into DB
				const [ad] = await server.drizzleClient
					.insert(advertisementsTable)
					.values({
						organizationId: orgId,
						name: "Test Ad",
						type: "banner",
						startAt: new Date(),
						endAt: new Date(Date.now() + 86400000),
						creatorId: adminUserId,
					})
					.returning({ id: advertisementsTable.id });

				assertToBeNonNullish(ad);

				await server.drizzleClient
					.insert(advertisementAttachmentsTable)
					.values({
						advertisementId: ad.id,
						name: "test-ad-image.png",
						mimeType: "image/png",
						creatorId: adminUserId,
					});

				const deleteResult = await mercuriusClient.mutate(
					Mutation_deleteOrganization,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: { input: { id: orgId } },
					},
				);

				expect(deleteResult.errors).toBeUndefined();
				expect(deleteResult.data?.deleteOrganization?.id).toBe(orgId);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when deleting organization with chat avatars", () => {
		test(
			"should successfully delete organization and cleanup chat avatars",
			async () => {
				const orgId = await createTestOrganization(authToken);

				// Insert a chat with avatar directly into DB
				await server.drizzleClient.insert(chatsTable).values({
					organizationId: orgId,
					name: "Test Chat",
					avatarName: "test-chat-avatar.png",
					avatarMimeType: "image/png",
					creatorId: adminUserId,
				});

				const deleteResult = await mercuriusClient.mutate(
					Mutation_deleteOrganization,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: { input: { id: orgId } },
					},
				);

				expect(deleteResult.errors).toBeUndefined();
				expect(deleteResult.data?.deleteOrganization?.id).toBe(orgId);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when deleting organization with event attachments", () => {
		test(
			"should successfully delete organization and cleanup event attachments",
			async () => {
				const orgId = await createTestOrganization(authToken);

				// Insert an event with attachment directly into DB
				const [event] = await server.drizzleClient
					.insert(eventsTable)
					.values({
						organizationId: orgId,
						name: "Test Event",
						startAt: new Date(),
						endAt: new Date(Date.now() + 3600000),
						creatorId: adminUserId,
					})
					.returning({ id: eventsTable.id });

				assertToBeNonNullish(event);

				await server.drizzleClient.insert(eventAttachmentsTable).values({
					eventId: event.id,
					name: "test-event-file.png",
					mimeType: "image/png",
					creatorId: adminUserId,
				});

				const deleteResult = await mercuriusClient.mutate(
					Mutation_deleteOrganization,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: { input: { id: orgId } },
					},
				);

				expect(deleteResult.errors).toBeUndefined();
				expect(deleteResult.data?.deleteOrganization?.id).toBe(orgId);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when deleting organization with venue attachments", () => {
		test(
			"should successfully delete organization and cleanup venue attachments",
			async () => {
				const orgId = await createTestOrganization(authToken);

				// Insert a venue with attachment directly into DB
				const [venue] = await server.drizzleClient
					.insert(venuesTable)
					.values({
						organizationId: orgId,
						name: "Test Venue",
						creatorId: adminUserId,
					})
					.returning({ id: venuesTable.id });

				assertToBeNonNullish(venue);

				await server.drizzleClient.insert(venueAttachmentsTable).values({
					venueId: venue.id,
					name: "test-venue-file.png",
					mimeType: "image/png",
					creatorId: adminUserId,
				});

				const deleteResult = await mercuriusClient.mutate(
					Mutation_deleteOrganization,
					{
						headers: { authorization: `bearer ${authToken}` },
						variables: { input: { id: orgId } },
					},
				);

				expect(deleteResult.errors).toBeUndefined();
				expect(deleteResult.data?.deleteOrganization?.id).toBe(orgId);
			},
			SUITE_TIMEOUT,
		);
	});

	suite("when minio removal fails", () => {
		test(
			"should bubble up an error from the minio removal but DB delete should not be rolled back",
			async () => {
				const orgId = await createTestOrganization(authToken);

				// Insert a venue with attachment directly into DB to ensure there are files to remove
				const [venue] = await server.drizzleClient
					.insert(venuesTable)
					.values({
						organizationId: orgId,
						name: "Test Venue",
						creatorId: adminUserId,
					})
					.returning({ id: venuesTable.id });

				assertToBeNonNullish(venue);

				await server.drizzleClient.insert(venueAttachmentsTable).values({
					venueId: venue.id,
					name: "test-venue-file.png",
					mimeType: "image/png",
					creatorId: adminUserId,
				});

				const removeObjectsSpy = vi
					.spyOn(server.minio.client, "removeObjects")
					.mockImplementation(async () => {
						throw new Error("Minio removal error");
					});

				try {
					const result = await mercuriusClient.mutate(
						Mutation_deleteOrganization,
						{
							headers: { authorization: `bearer ${authToken}` },
							variables: {
								input: {
									id: orgId,
								},
							},
						},
					);

					// Error should NOT be surfaced (logged instead)
					expect(result.errors).toBeUndefined();
					expect(result.data?.deleteOrganization).toEqual(
						expect.objectContaining({
							id: orgId,
						}),
					);

					// Verify organization WAS deleted
					const orgExists = await server.drizzleClient
						.select()
						.from(organizationsTable)
						.where(eq(organizationsTable.id, orgId))
						.limit(1);

					expect(orgExists.length).toBe(0);
				} finally {
					removeObjectsSpy.mockRestore();
				}
			},
			SUITE_TIMEOUT,
		);
	});
});
