import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_createUser,
	Mutation_deleteUser,
	Query_signIn,
	Query_user,
} from "../documentNodes";

const signInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});
assertToBeNonNullish(signInResult.data?.signIn);
const authToken = signInResult.data?.signIn?.authenticationToken;
assertToBeNonNullish(authToken);

suite("Query field user - Functional Testing", () => {
	suite("when input validation fails", () => {
		test("should handle invalid input gracefully", async () => {
			const result = await mercuriusClient.query(Query_user, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: "", // empty string validation failure
					},
				},
			});

			assertToBeNonNullish(result.errors);
			expect(result.errors).toHaveLength(1);
			expect(result.errors).toContainEqual(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "invalid_arguments",
						issues: expect.any(Array),
					}),
				}),
			);
		});

		test("should return error for non-existent user ID", async () => {
			const result = await mercuriusClient.query(Query_user, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: faker.string.uuid(),
					},
				},
			});

			assertToBeNonNullish(result.errors);
			expect(result.errors).toHaveLength(1);
			expect(result.errors).toContainEqual(
				expect.objectContaining({
					extensions: expect.objectContaining({
						code: "arguments_associated_resources_not_found",
						issues: expect.arrayContaining([
							expect.objectContaining({
								argumentPath: ["input", "id"],
							}),
						]),
					}),
				}),
			);
		});
	});

	suite("when user exists", () => {
		test("should successfully return user data", async () => {
			// Create a user first
			const createUserResult = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `Test User ${faker.string.ulid()}`,
							emailAddress: faker.internet.email().toLowerCase(),
							password: faker.internet.password({ length: 20 }),
							role: "regular" as const,
							isEmailAddressVerified: true,
						},
					},
				},
			);

			const userId = createUserResult.data?.createUser?.user?.id;
			expect(createUserResult.errors).toBeUndefined();
			assertToBeNonNullish(userId);

			// Query the user
			const result = await mercuriusClient.query(Query_user, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: userId,
					},
				},
			});

			// Verify the query was successful
			expect(result.errors).toBeUndefined();
			expect(result.data?.user).toBeDefined();
			expect(result.data?.user?.id).toBe(userId);
			expect(result.data?.user?.name).toBe(
				createUserResult.data?.createUser?.user?.name,
			);
			expect(result.data?.user?.emailAddress).toBe(
				createUserResult.data?.createUser?.user?.emailAddress,
			);

			// Cleanup
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: userId,
					},
				},
			});
		});

		test("should handle multiple queries for different users", async () => {
			// Create two users
			const createUser1Result = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `User One ${faker.string.ulid()}`,
							emailAddress: faker.internet.email().toLowerCase(),
							password: faker.internet.password({ length: 20 }),
							role: "regular" as const,
							isEmailAddressVerified: true,
						},
					},
				},
			);

			const createUser2Result = await mercuriusClient.mutate(
				Mutation_createUser,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: {
							name: `User Two ${faker.string.ulid()}`,
							emailAddress: faker.internet.email().toLowerCase(),
							password: faker.internet.password({ length: 20 }),
							role: "regular" as const,
							isEmailAddressVerified: true,
						},
					},
				},
			);

			const user1Id = createUser1Result.data?.createUser?.user?.id;
			const user2Id = createUser2Result.data?.createUser?.user?.id;
			assertToBeNonNullish(user1Id);
			assertToBeNonNullish(user2Id);

			// Query both users
			const result1 = await mercuriusClient.query(Query_user, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: user1Id,
					},
				},
			});

			const result2 = await mercuriusClient.query(Query_user, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: user2Id,
					},
				},
			});

			// Verify both queries succeeded
			expect(result1.errors).toBeUndefined();
			expect(result2.errors).toBeUndefined();
			expect(result1.data?.user?.id).toBe(user1Id);
			expect(result2.data?.user?.id).toBe(user2Id);
			expect(result1.data?.user?.name).toContain("User One");
			expect(result2.data?.user?.name).toContain("User Two");

			// Cleanup
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: user1Id,
					},
				},
			});
			await mercuriusClient.mutate(Mutation_deleteUser, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: {
						id: user2Id,
					},
				},
			});
		});
	});
});
