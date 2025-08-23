import { faker } from "@faker-js/faker";
import { expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_deleteCurrentUser,
	Query_signIn,
	Mutation_updatePostVote as UPDATE_POST_VOTE,
} from "../documentNodes";

const signInResult = await mercuriusClient.query(Query_signIn, {
	variables: {
		input: {
			emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
			password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
		},
	},
});
const adminToken = signInResult.data?.signIn?.authenticationToken ?? null;
assertToBeNonNullish(adminToken);

suite("Mutation field updatePostVote", () => {
	suite("when client is not authenticated", () => {
		test("should return unauthenticated error", async () => {
			const result = await mercuriusClient.mutate(UPDATE_POST_VOTE, {
				variables: {
					input: { postId: faker.string.uuid(), type: "up_vote" },
				},
			});

			expect(result.data?.updatePostVote ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["updatePostVote"],
					}),
				]),
			);
		});
	});

	suite("when input arguments are invalid", () => {
		test("should return invalid_arguments", async () => {
			const result = await mercuriusClient.mutate(UPDATE_POST_VOTE, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: { postId: "abc", type: "up_vote" }, // invalid UUID
				},
			});

			expect(result.data?.updatePostVote ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "invalid_arguments" }),
						path: ["updatePostVote"],
					}),
				]),
			);
		});
	});

	suite("when user does not exist in DB", () => {
		test("should return unauthenticated", async () => {
			const { authToken } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(authToken);

			await mercuriusClient.mutate(Mutation_deleteCurrentUser, {
				headers: { authorization: `bearer ${authToken}` },
			});

			const result = await mercuriusClient.mutate(UPDATE_POST_VOTE, {
				headers: { authorization: `bearer ${authToken}` },
				variables: {
					input: { postId: faker.string.uuid(), type: "up_vote" },
				},
			});

			expect(result.data?.updatePostVote ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["updatePostVote"],
					}),
				]),
			);
		});
	});

	suite("when post does not exist", () => {
		test("should return arguments_associated_resources_not_found", async () => {
			const result = await mercuriusClient.mutate(UPDATE_POST_VOTE, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: { postId: faker.string.uuid(), type: "up_vote" },
				},
			});

			expect(result.data?.updatePostVote ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["updatePostVote"],
					}),
				]),
			);
		});
	});

	suite("when updating vote", () => {
		test("should return unexpected when DB update returns empty array", async () => {
			const originalTransaction = server.drizzleClient.transaction;
			server.drizzleClient.transaction = vi
				.fn()
				.mockImplementation(async (cb) => {
					const mockTx = {
						insert: () => ({
							values: () => ({
								returning: async () => [],
							}),
						}),
						update: () => ({
							set: () => ({
								where: () => ({
									returning: async () => [],
								}),
							}),
						}),
					};
					return await cb(mockTx);
				});

			try {
				const result = await mercuriusClient.mutate(UPDATE_POST_VOTE, {
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: { postId: faker.string.uuid(), type: "up_vote" },
					},
				});

				expect(result.data?.updatePostVote ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "arguments_associated_resources_not_found",
							}),
						}),
					]),
				);
			} finally {
				server.drizzleClient.transaction = originalTransaction;
			}
		});
	});
});
