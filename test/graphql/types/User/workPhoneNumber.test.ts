import { faker } from "@faker-js/faker";
import { createMockGraphQLContext } from "test/_Mocks_/mockContextCreator/mockContextCreator";
import { expect, suite, test } from "vitest";
import type { User as UserType } from "~/src/graphql/types/User/User";
import { workPhoneNumberResolver } from "~/src/graphql/types/User/workPhoneNumber";
import type {
	// removed unused import
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createUser,
	Mutation_deleteUser,
	Query_signIn,
	Query_user_workPhoneNumber,
} from "../documentNodes";

suite("User field workPhoneNumber", () => {
	suite("Integration Tests", () => {
		test('results in a graphql error with "unauthenticated" extensions code when client is not authenticated', async () => {
			// 1. Sign in as admin to create a target user
			const adminSignIn = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(adminSignIn.data.signIn?.authenticationToken);
			const token = adminSignIn.data.signIn.authenticationToken;

			const createUser = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${token}` },
				variables: {
					input: {
						emailAddress: `target-${faker.string.uuid()}@example.com`,
						isEmailAddressVerified: false,
						name: "Target User",
						password: "password123",
						role: "regular",
					},
				},
			});
			assertToBeNonNullish(createUser.data.createUser?.user?.id);
			const targetUserId = createUser.data.createUser.user.id;

			// 2. Query without auth
			const result = await mercuriusClient.query(Query_user_workPhoneNumber, {
				variables: {
					input: {
						id: targetUserId,
					},
				},
			});

			expect(result.data.user).toEqual({ workPhoneNumber: null });
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["user", "workPhoneNumber"],
					}),
				]),
			);

			// Cleanup
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${token}` },
				variables: { input: { id: targetUserId } },
			});
		});

		test('results in a graphql error with "unauthenticated" extension code when authenticated user does not exist', async () => {
			// 1. Sign in as admin to get a valid token
			const adminSignIn = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(adminSignIn.data.signIn?.authenticationToken);
			const token = adminSignIn.data.signIn.authenticationToken;

			// 2. Create User A (who will be deleted)
			const userA = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${token}` },
				variables: {
					input: {
						emailAddress: `usera-${faker.string.uuid()}@example.com`,
						isEmailAddressVerified: false,
						name: "User A",
						password: "password123",
						role: "regular",
					},
				},
			});
			assertToBeNonNullish(userA.data.createUser?.user?.id);
			assertToBeNonNullish(userA.data.createUser.authenticationToken);
			const userAId = userA.data.createUser.user.id;
			const userAToken = userA.data.createUser.authenticationToken;

			// 3. Create User B (target)
			const userB = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${token}` },
				variables: {
					input: {
						emailAddress: `userb-${faker.string.uuid()}@example.com`,
						isEmailAddressVerified: false,
						name: "User B",
						password: "password123",
						role: "regular",
					},
				},
			});
			assertToBeNonNullish(userB.data.createUser?.user?.id);
			const userBId = userB.data.createUser.user.id;

			// 4. Delete User A
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${token}` },
				variables: { input: { id: userAId } },
			});

			// 5. Try to query User B with User A's token
			const result = await mercuriusClient.query(Query_user_workPhoneNumber, {
				headers: { authorization: `bearer ${userAToken}` },
				variables: { input: { id: userBId } },
			});

			expect(result.data.user).toEqual({ workPhoneNumber: null });
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						message: expect.any(String),
						path: ["user", "workPhoneNumber"],
					}),
				]),
			);

			// Cleanup User B
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${token}` },
				variables: { input: { id: userBId } },
			});
		});

		test('results in "unauthorized_action" error when non-admin accesses another user\'s workPhoneNumber', async () => {
			// 1. Sign in as admin
			const adminSignIn = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(adminSignIn.data.signIn?.authenticationToken);
			const token = adminSignIn.data.signIn.authenticationToken;

			// 2. Create User A (the requester)
			const userA = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${token}` },
				variables: {
					input: {
						emailAddress: `userA-${faker.string.uuid()}@example.com`,
						isEmailAddressVerified: false,
						name: "User A",
						password: "password123",
						role: "regular",
					},
				},
			});
			assertToBeNonNullish(userA.data.createUser?.user?.id);
			assertToBeNonNullish(userA.data.createUser.authenticationToken);

			// 3. Create User B (the target)
			const userB = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${token}` },
				variables: {
					input: {
						emailAddress: `userB-${faker.string.uuid()}@example.com`,
						isEmailAddressVerified: false,
						name: "User B",
						password: "password123",
						role: "regular",
					},
				},
			});
			assertToBeNonNullish(userB.data.createUser?.user?.id);

			// 4. User A tries to query User B's workPhoneNumber
			const result = await mercuriusClient.query(Query_user_workPhoneNumber, {
				headers: {
					authorization: `bearer ${userA.data.createUser.authenticationToken}`,
				},
				variables: { input: { id: userB.data.createUser.user.id } },
			});

			expect(result.data.user).toEqual({ workPhoneNumber: null });
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthorizedActionExtensions>({
							code: "unauthorized_action",
						}),
						message: expect.any(String),
						path: ["user", "workPhoneNumber"],
					}),
				]),
			);

			// Cleanup
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${token}` },
				variables: { input: { id: userA.data.createUser.user.id } },
			});
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${token}` },
				variables: { input: { id: userB.data.createUser.user.id } },
			});
		});

		test("returns workPhoneNumber when user accesses their own data", async () => {
			// 1. Sign in as admin
			const adminSignIn = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(adminSignIn.data.signIn?.authenticationToken);
			const token = adminSignIn.data.signIn.authenticationToken;

			// 2. Create User
			const userRes = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${token}` },
				variables: {
					input: {
						emailAddress: `self-${faker.string.uuid()}@example.com`,
						isEmailAddressVerified: false,
						name: "Self User",
						password: "password123",
						role: "regular",
						workPhoneNumber: "123-456-7890",
					},
				},
			});
			assertToBeNonNullish(userRes.data.createUser?.user?.id);
			assertToBeNonNullish(userRes.data.createUser.authenticationToken);

			// 3. User queries own data
			const result = await mercuriusClient.query(Query_user_workPhoneNumber, {
				headers: {
					authorization: `bearer ${userRes.data.createUser.authenticationToken}`,
				},
				variables: { input: { id: userRes.data.createUser.user.id } },
			});

			expect(result.errors).toBeUndefined();
			expect(result.data.user?.workPhoneNumber).toBe("123-456-7890");

			// Cleanup
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${token}` },
				variables: { input: { id: userRes.data.createUser.user.id } },
			});
		});

		test("returns workPhoneNumber when administrator accesses another user's data", async () => {
			// 1. Sign in as admin
			const adminSignIn = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			assertToBeNonNullish(adminSignIn.data.signIn?.authenticationToken);
			const token = adminSignIn.data.signIn.authenticationToken;

			// 2. Create User
			const userRes = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${token}` },
				variables: {
					input: {
						emailAddress: `target-${faker.string.uuid()}@example.com`,
						isEmailAddressVerified: false,
						name: "Target User",
						password: "password123",
						role: "regular",
						workPhoneNumber: "987-654-3210",
					},
				},
			});
			assertToBeNonNullish(userRes.data.createUser?.user?.id);

			// 3. Admin queries user data
			const result = await mercuriusClient.query(Query_user_workPhoneNumber, {
				headers: { authorization: `bearer ${token}` },
				variables: { input: { id: userRes.data.createUser.user.id } },
			});

			expect(result.errors).toBeUndefined();
			expect(result.data.user?.workPhoneNumber).toBe("987-654-3210");

			// Cleanup
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${token}` },
				variables: { input: { id: userRes.data.createUser.user.id } },
			});
		});
	});

	suite("Unit Tests", () => {
		test("handles null or empty workPhoneNumber correctly", async () => {
			const _userId = faker.string.uuid();
			const { context, mocks } = createMockGraphQLContext(true, _userId);

			const parent: UserType = {
				id: _userId,
				name: "Test User",
				workPhoneNumber: null, // Test null case
				role: "regular",
				createdAt: new Date(),
				updatedAt: null,
				creatorId: "creator-1",
				updaterId: null,
			} as unknown as UserType;

			// Mock finding the user (self-access allowed)
			mocks.drizzleClient.query.usersTable.findFirst.mockResolvedValue({
				role: "regular",
			});

			const result = await workPhoneNumberResolver(parent, {}, context);
			const emptyResult = await workPhoneNumberResolver(
				{ ...parent, workPhoneNumber: "" },
				{},
				context,
			);

			expect(result).toBeNull();
			expect(emptyResult).toBe("");
		});
	});
});
