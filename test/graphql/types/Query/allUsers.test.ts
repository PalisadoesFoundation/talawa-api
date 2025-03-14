import { faker } from "@faker-js/faker";
import { afterAll, beforeAll, expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createUser,
	Mutation_deleteUser,
	Query_allUsers,
	Query_signIn,
} from "../documentNodes";

suite("Query field allUsers", () => {
	let adminAuthToken: string;
	let regularUserAuthToken: string;
	let regularUserId: string;

	// Setup: Create admin and regular user tokens
	beforeAll(async () => {
		// Sign in as admin
		const adminSignInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});

		if (!adminSignInResult.data?.signIn?.authenticationToken) {
			throw new Error(
				"Failed to get admin authentication token: Sign in response did not contain auth token",
			);
		}
		adminAuthToken = adminSignInResult.data.signIn.authenticationToken;

		// Create and sign in as regular user
		const createUserResult = await mercuriusClient.mutate(Mutation_createUser, {
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					emailAddress: `${faker.string.ulid()}@test.com`,
					isEmailAddressVerified: false,
					name: "Regular User",
					password: "password123",
					role: "regular",
				},
			},
		});

		if (!createUserResult.data?.createUser?.user?.id) {
			throw new Error(
				"Failed to create regular user: Create user mutation response did not contain user ID",
			);
		}
		regularUserId = createUserResult.data.createUser.user?.id;
		regularUserAuthToken =
			createUserResult.data.createUser.authenticationToken || "";
	});

	// Cleanup
	afterAll(async () => {
		if (regularUserId) {
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						id: regularUserId,
					},
				},
			});
		}
	});

	suite("Authentication and Authorization", () => {
		test("returns error when user is not authenticated", async () => {
			const result = await mercuriusClient.query(Query_allUsers, {
				variables: {
					first: 5,
				},
			});

			expect(result.data?.allUsers).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						message: expect.stringContaining(
							"You must be authenticated to perform this action.",
						),
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
					}),
				]),
			);
		});

		test("returns error when authenticated user is not an administrator", async () => {
			const result = await mercuriusClient.query(Query_allUsers, {
				headers: {
					authorization: `bearer ${regularUserAuthToken}`,
				},
				variables: {
					first: 5,
				},
			});

			expect(result.data?.allUsers).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action",
						}),
					}),
				]),
			);
		});

		test("returns error when authenticated user is deleted but token is still valid", async () => {
			//user2
			// Create and sign in as regular user
			const createUser2Result = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							emailAddress: `${faker.string.ulid()}2@test.com`,
							isEmailAddressVerified: false,
							name: "Regular User 2",
							password: "password123",
							role: "regular",
						},
					},
				},
			);

			assertToBeNonNullish(createUser2Result.data?.createUser);
			const regularUser2Id = createUser2Result.data.createUser.user?.id;
			const regularUser2AuthToken =
				createUser2Result.data.createUser.authenticationToken || "";

			if (regularUser2Id) {
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							id: regularUser2Id,
						},
					},
				});
			}
			const result = await mercuriusClient.query(Query_allUsers, {
				headers: {
					authorization: `bearer ${regularUser2AuthToken}`,
				},
				variables: {
					first: 5,
				},
			});

			expect(result.data?.allUsers).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
					}),
				]),
			);
		});
	});

	suite("Pagination", () => {
		test("returns first page of results with default pagination", async () => {
			const result = await mercuriusClient.query(Query_allUsers, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					first: 10,
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.allUsers?.edges).toBeDefined();
			expect(result.data?.allUsers?.pageInfo).toBeDefined();
			expect(Array.isArray(result.data?.allUsers?.edges)).toBe(true);
			expect(result.data?.allUsers?.edges?.length).toBeLessThanOrEqual(10);
			expect(result.data?.allUsers?.pageInfo).toEqual(
				expect.objectContaining({
					hasNextPage: expect.any(Boolean),
					hasPreviousPage: expect.any(Boolean),
				}),
			);
		});

		test("handles forward pagination with cursor", async () => {
			// First page
			const firstResult = await mercuriusClient.query(Query_allUsers, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					first: 2,
				},
			});

			if (!firstResult.data?.allUsers?.edges?.[1]) {
				throw new Error("Failed to get first page of results");
			}
			const cursor = firstResult.data.allUsers.edges[1].cursor;

			// Next page
			const nextResult = await mercuriusClient.query(Query_allUsers, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					first: 2,
					after: cursor,
				},
			});

			expect(nextResult.errors).toBeUndefined();
			expect(nextResult.data?.allUsers?.edges).toBeDefined();
			if (!nextResult.data?.allUsers?.edges?.[0]) {
				throw new Error("Failed to get next page of results");
			}
			expect(nextResult.data.allUsers.edges[0].cursor).not.toBe(cursor);
		});

		test("handles backward pagination with cursor", async () => {
			// Get some initial data
			const initialResult = await mercuriusClient.query(Query_allUsers, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					first: 3,
				},
			});

			if (!initialResult.data?.allUsers?.edges?.[2]) {
				throw new Error("Failed to get initial page of results");
			}
			const cursor = initialResult.data.allUsers.edges[2].cursor;

			// Get previous page
			const previousResult = await mercuriusClient.query(Query_allUsers, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					last: 2,
					before: cursor,
				},
			});

			expect(previousResult.errors).toBeUndefined();
			expect(previousResult.data?.allUsers?.edges).toBeDefined();
			expect(previousResult.data?.allUsers?.edges?.length).toBeLessThanOrEqual(
				2,
			);
		});
	});

	suite("Name Search", () => {
		test("filters users by name search", async () => {
			const uniqueName = `Test${faker.string.alphanumeric(10)}`;
			let userId: string | undefined;

			// Create a user with unique name
			const createResult = await mercuriusClient.mutate(Mutation_createUser, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					input: {
						emailAddress: `${faker.string.ulid()}@test.com`,
						isEmailAddressVerified: false,
						name: uniqueName,
						password: "password123",
						role: "regular",
					},
				},
			});

			userId = createResult.data?.createUser?.user?.id;

			const result = await mercuriusClient.query(Query_allUsers, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					first: 5,
					where: { name: uniqueName },
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.allUsers?.edges).toBeDefined();
			expect(result.data?.allUsers?.edges?.length).toBeGreaterThan(0);
			if (!result.data?.allUsers?.edges?.[0]?.node) {
				throw new Error("Failed to find user with unique name");
			}
			expect(result.data.allUsers.edges[0].node.name).toBe(uniqueName);

			// Cleanup
			if (userId) {
				await mercuriusClient.mutate(Mutation_deleteUser, {
					headers: {
						authorization: `bearer ${adminAuthToken}`,
					},
					variables: {
						input: {
							id: userId,
						},
					},
				});
			}
		});

		test("returns empty result for non-matching name search", async () => {
			const result = await mercuriusClient.query(Query_allUsers, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					first: 5,
					where: {
						name: `NonExistentUserName${faker.string.alphanumeric(10)}`,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.allUsers?.edges).toHaveLength(0);
		});

		test("returns empty result for non-matching name search using last", async () => {
			const result = await mercuriusClient.query(Query_allUsers, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					last: 5,
					where: {
						name: `NonExistentUserName${faker.string.alphanumeric(10)}`,
					},
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data?.allUsers?.edges).toHaveLength(0);
		});
	});

	suite("Input Validation", () => {
		test("validates minimum name length", async () => {
			const result = await mercuriusClient.query(Query_allUsers, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					first: 5,
					where: { name: "" },
				},
			});

			expect(result.data?.allUsers).toBeNull();
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

		test("validates pagination arguments", async () => {
			const result = await mercuriusClient.query(Query_allUsers, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					first: -1,
				},
			});

			expect(result.data?.allUsers).toBeNull();
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

		test("returns error for invalid cursor using first", async () => {
			const result = await mercuriusClient.query(Query_allUsers, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					first: 5,
					after: "eyJjcmVhdGVkQXQiOiIyMDI1LTAyLTA4VD",
				},
			});

			expect(result.data?.allUsers).toBeNull();
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

		test("returns error for invalid cursor using last", async () => {
			const result = await mercuriusClient.query(Query_allUsers, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					last: 5,
					before: "eyJjcmVhdGVkQXQiOiIyMDI1LTAyLTA4VD",
				},
			});

			expect(result.data?.allUsers).toBeNull();
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

		test("returns error for cursor of non-existing user", async () => {
			const result = await mercuriusClient.query(Query_allUsers, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					first: 5,
					after:
						"eyJjcmVhdGVkQXQiOiIyMDI1LTAyLTA4VDEzOjM2OjQ4LjkxNVoiLCJpZCI6IjAxOTRlNWM2LWY1MTMtNzM1OS05ZTBiLTgyYzkxZWIxOTYwZiJ9",
				},
			});

			expect(result.data?.allUsers).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
					}),
				]),
			);
		});

		test("returns error for cursor of non-existing user using last", async () => {
			const result = await mercuriusClient.query(Query_allUsers, {
				headers: {
					authorization: `bearer ${adminAuthToken}`,
				},
				variables: {
					last: 5,
					before:
						"eyJjcmVhdGVkQXQiOiIyMDI1LTAyLTA4VDEzOjM2OjQ4LjkxNVoiLCJpZCI6IjAxOTRlNWM2LWY1MTMtNzM1OS05ZTBiLTgyYzkxZWIxOTYwZiJ9",
				},
			});

			expect(result.data?.allUsers).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["before"],
								}),
							]),
						}),
					}),
				]),
			);
		});
	});
});
