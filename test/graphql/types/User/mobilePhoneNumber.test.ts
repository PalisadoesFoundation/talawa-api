import { faker } from "@faker-js/faker";
import { afterEach, expect, suite, test } from "vitest";
import type {
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
	Query_user_mobilePhoneNumber,
} from "../documentNodes";

suite("User field mobilePhoneNumber", () => {
	suite("Integration Tests", () => {
		const createdUserIds: string[] = [];

		afterEach(async () => {
			if (createdUserIds.length > 0) {
				const adminSignIn = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});
				const token = adminSignIn.data.signIn?.authenticationToken;

				if (token) {
					for (const id of createdUserIds) {
						try {
							await mercuriusClient.mutate(Mutation_deleteUser, {
								headers: { authorization: `bearer ${token}` },
								variables: { input: { id } },
							});
						} catch (error) {
							console.warn(`Failed to delete user ${id} in cleanup`, error);
						}
					}
					createdUserIds.length = 0;
				}
			}
		});

		test("returns unauthenticated error when client is not authenticated", async () => {
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
			createdUserIds.push(targetUserId);

			// 2. Query without auth
			const result = await mercuriusClient.query(Query_user_mobilePhoneNumber, {
				variables: {
					input: {
						id: targetUserId,
					},
				},
			});

			expect(result.data.user).toEqual({ mobilePhoneNumber: null });
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthenticatedExtensions>({
							code: "unauthenticated",
						}),
						path: ["user", "mobilePhoneNumber"],
					}),
				]),
			);
		});

		test("returns unauthorized_action error when non-admin accesses another user's data", async () => {
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
			createdUserIds.push(userA.data.createUser.user.id);

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
			createdUserIds.push(userB.data.createUser.user.id);

			// 4. User A tries to query User B's mobilePhoneNumber
			const result = await mercuriusClient.query(Query_user_mobilePhoneNumber, {
				headers: {
					authorization: `bearer ${userA.data.createUser?.authenticationToken}`,
				},
				variables: { input: { id: userB.data.createUser?.user?.id as string } },
			});

			expect(result.data.user).toEqual({ mobilePhoneNumber: null });
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining<UnauthorizedActionExtensions>({
							code: "unauthorized_action",
						}),
						path: ["user", "mobilePhoneNumber"],
					}),
				]),
			);
		});

		test("returns mobilePhoneNumber when user accesses their own data", async () => {
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
			const expectedPhoneNumber = "1234567890";
			const userRes = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${token}` },
				variables: {
					input: {
						emailAddress: `self-${faker.string.uuid()}@example.com`,
						isEmailAddressVerified: false,
						name: "Self User",
						password: "password123",
						role: "regular",
						mobilePhoneNumber: expectedPhoneNumber,
					},
				},
			});
			assertToBeNonNullish(userRes.data.createUser?.user?.id);
			createdUserIds.push(userRes.data.createUser.user.id);

			// 3. User queries own data
			const result = await mercuriusClient.query(Query_user_mobilePhoneNumber, {
				headers: {
					authorization: `bearer ${userRes.data.createUser?.authenticationToken}`,
				},
				variables: {
					input: { id: userRes.data.createUser?.user?.id as string },
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data.user?.mobilePhoneNumber).toBe(expectedPhoneNumber);
		});

		test("returns mobilePhoneNumber when administrator accesses another user's data", async () => {
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
			const expectedPhoneNumber = "9876543210";
			const userRes = await mercuriusClient.mutate(Mutation_createUser, {
				headers: { authorization: `bearer ${token}` },
				variables: {
					input: {
						emailAddress: `target-${faker.string.uuid()}@example.com`,
						isEmailAddressVerified: false,
						name: "Target User",
						password: "password123",
						role: "regular",
						mobilePhoneNumber: expectedPhoneNumber,
					},
				},
			});
			assertToBeNonNullish(userRes.data.createUser?.user?.id);
			createdUserIds.push(userRes.data.createUser.user.id);

			// 3. Admin queries user data
			const result = await mercuriusClient.query(Query_user_mobilePhoneNumber, {
				headers: { authorization: `bearer ${token}` },
				variables: {
					input: { id: userRes.data.createUser?.user?.id as string },
				},
			});

			expect(result.errors).toBeUndefined();
			expect(result.data.user?.mobilePhoneNumber).toBe(expectedPhoneNumber);
		});
	});
});
