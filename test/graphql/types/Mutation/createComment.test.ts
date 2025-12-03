import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import type {
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { mercuriusClient } from "../client";
import { Mutation_createComment } from "../documentNodes";

suite("Mutation field createComment", () => {
	suite(
		"results in a graphql error with 'unauthenticated' as the extensions code in the 'errors' field and 'null' as the value of 'data.createComment' field if",
		() => {
			test("the client triggering the graphql mutation is not authenticated", async () => {
				const createCommentResult = await mercuriusClient.mutate(
					Mutation_createComment,
					{
						variables: {
							input: {
								body: "body",
								postId: faker.string.uuid(),
							},
						},
					},
				);

				expect(createCommentResult.data.createComment).toEqual(null);
				expect(createCommentResult.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["createComment"],
						}),
					]),
				);
			});

			// test("client triggering the graphql mutation has no existing user associated to their authentication context.", async () => {

			// });
		},
	);
});
