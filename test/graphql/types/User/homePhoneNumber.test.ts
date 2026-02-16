import { faker } from "@faker-js/faker";
import { afterEach, expect, suite, test, vi } from "vitest";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createUser,
	Mutation_deleteUser,
	Query_signIn,
	Query_user_homePhoneNumber,
} from "../documentNodes";

suite("User field homePhoneNumber", () => {
	const createdUserIds: string[] = [];

	afterEach(async () => {
		try {
			if (createdUserIds.length > 0) {
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

				for (const id of createdUserIds) {
					try {
						await mercuriusClient.mutate(Mutation_deleteUser, {
							headers: { authorization: `bearer ${token}` },
							variables: { input: { id } },
						});
					} catch (error) {
						console.warn(`Cleanup failed for user ${id}:`, error);
					}
				}
			}
		} catch (error) {
			console.warn("Cleanup sign-in failed:", error);
		} finally {
			createdUserIds.length = 0;
			vi.restoreAllMocks();
		}
	});

	test('returns "unauthenticated" when client is not authenticated', async () => {
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

		const result = await mercuriusClient.query(Query_user_homePhoneNumber, {
			variables: { input: { id: targetUserId } },
		});

		expect(result.data.user).toEqual({ homePhoneNumber: null });
		expect(result.errors).toEqual(
			expect.arrayContaining<TalawaGraphQLFormattedError>([
				expect.objectContaining({
					extensions: expect.objectContaining<UnauthenticatedExtensions>({
						code: "unauthenticated",
					}),
					path: ["user", "homePhoneNumber"],
				}),
			]),
		);
	});

	test("returns homePhoneNumber for self access", async () => {
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

		const userRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					emailAddress: `self-${faker.string.uuid()}@example.com`,
					isEmailAddressVerified: false,
					name: "Self User",
					password: "password123",
					role: "regular",
					homePhoneNumber: "111-222-3333",
				},
			},
		});

		assertToBeNonNullish(userRes.data.createUser?.user?.id);
		assertToBeNonNullish(userRes.data.createUser?.authenticationToken);
		createdUserIds.push(userRes.data.createUser.user.id);

		const result = await mercuriusClient.query(Query_user_homePhoneNumber, {
			headers: { authorization: `bearer ${userRes.data.createUser.authenticationToken}` },
			variables: { input: { id: userRes.data.createUser.user.id } },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data.user?.homePhoneNumber).toBe("111-222-3333");
	});

	test("returns null when homePhoneNumber was never set", async () => {
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

		const userRes = await mercuriusClient.mutate(Mutation_createUser, {
			headers: { authorization: `bearer ${token}` },
			variables: {
				input: {
					emailAddress: `noset-${faker.string.uuid()}@example.com`,
					isEmailAddressVerified: false,
					name: "No Phone User",
					password: "password123",
					role: "regular",
				},
			},
		});

		assertToBeNonNullish(userRes.data.createUser?.user?.id);
		assertToBeNonNullish(userRes.data.createUser?.authenticationToken);
		createdUserIds.push(userRes.data.createUser.user.id);

		const result = await mercuriusClient.query(Query_user_homePhoneNumber, {
			headers: { authorization: `bearer ${userRes.data.createUser.authenticationToken}` },
			variables: { input: { id: userRes.data.createUser.user.id } },
		});

		expect(result.errors).toBeUndefined();
		expect(result.data.user?.homePhoneNumber).toBeNull();
	});
});
