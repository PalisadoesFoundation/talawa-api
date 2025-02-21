import { faker } from "@faker-js/faker";
import { hash } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { organizationsTable, postsTable, usersTable } from "src/drizzle/schema";
import { uuidv7 } from "uuidv7";
import { beforeEach, expect, suite, test } from "vitest";
import type {
	ArgumentsAssociatedResourcesNotFoundExtensions,
	InvalidArgumentsExtensions,
	TalawaGraphQLFormattedError,
	UnauthenticatedExtensions,
	UnauthorizedActionOnArgumentsAssociatedResourcesExtensions,
} from "~/src/utilities/TalawaGraphQLError";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { Query_post, Query_signIn } from "../documentNodes";

suite("Query field post", () => {
	let adminUserId: string;

	// Add the helper function for creating test users
	const createTestUser = async (
		role: "regular" | "administrator" = "regular",
	) => {
		const testEmail = `test.user.${faker.string.ulid()}@email.com`;
		const testPassword = "password";

		const hashedPassword = await hash(testPassword);

		const [userRow] = await server.drizzleClient
			.insert(usersTable)
			.values({
				emailAddress: testEmail,
				passwordHash: hashedPassword,
				role,
				name: faker.person.fullName(),
				isEmailAddressVerified: true,
			})
			.returning({
				id: usersTable.id,
			});

		if (!userRow)
			throw new Error(
				"Failed to create test user: Database insert operation returned no rows",
			);

		return { userId: userRow.id, email: testEmail, password: testPassword };
	};

	beforeEach(async () => {
		const [existingAdmin] = await server.drizzleClient
			.select({ id: usersTable.id })
			.from(usersTable)
			.where(
				eq(
					usersTable.emailAddress,
					server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				),
			)
			.limit(1);
		if (existingAdmin) {
			adminUserId = existingAdmin.id;
			return;
		}
		const [newAdmin] = await server.drizzleClient
			.insert(usersTable)
			.values({
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				passwordHash: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				role: "administrator",
				name: server.envConfig.API_ADMINISTRATOR_USER_NAME,
				isEmailAddressVerified: true,
			})
			.onConflictDoNothing()
			.returning({ id: usersTable.id });
		if (!newAdmin) throw new Error("Failed to create admin user");
		adminUserId = newAdmin.id;
	});

	const getAuthToken = async () => {
		const signInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		if (!signInResult.data?.signIn?.authenticationToken) {
			throw new Error(
				"Failed to get authentication token: Sign-in operation failed",
			);
		}
		return signInResult.data.signIn?.authenticationToken;
	};

	const createTestPost = async (creatorId: string) => {
		const [organizationRow] = await server.drizzleClient
			.insert(organizationsTable)
			.values({
				name: faker.company.name(),
				countryCode: "us",
			})
			.returning({ id: organizationsTable.id });

		const organizationId = organizationRow?.id;
		if (!organizationId) throw new Error("Failed to create organization.");

		const [postRow] = await server.drizzleClient
			.insert(postsTable)
			.values({
				caption: faker.lorem.paragraph(),
				creatorId,
				organizationId,
			})
			.returning({ id: postsTable.id });

		const postId = postRow?.id;
		if (!postId) throw new Error("Failed to create post.");

		return { postId, organizationId };
	};

	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.post" field if`,
		() => {
			test("client triggering the graphql operation is not authenticated.", async () => {
				const result = await mercuriusClient.query(Query_post, {
					variables: {
						input: {
							id: uuidv7(),
						},
					},
				});
				expect(result.data.post).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["post"],
						}),
					]),
				);
			});
		},
	);
	suite(
		`results in a graphql error with "invalid_arguments" extensions code in the "errors" field and "null" as the value of "data.post" field if`,
		() => {
			test("the provided post ID is not a valid UUID.", async () => {
				const authToken = await getAuthToken();
				const result = await mercuriusClient.query(Query_post, {
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							id: "not-a-uuid",
						},
					},
				});
				expect(result.data.post).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<InvalidArgumentsExtensions>({
								code: "invalid_arguments",
								issues: expect.arrayContaining([
									{
										argumentPath: ["input", "id"],
										message: expect.any(String),
									},
								]),
							}),
							message: expect.any(String),
							path: ["post"],
						}),
					]),
				);
			});
		},
	);
	suite(
		`results in a graphql error with "arguments_associated_resources_not_found" extensions code in the "errors" field and "null" as the value of "data.post" field if`,
		() => {
			test(`value of the "input.id" does not correspond to an existing post.`, async () => {
				const authToken = await getAuthToken();
				const result = await mercuriusClient.query(Query_post, {
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							id: uuidv7(),
						},
					},
				});
				expect(result.data.post).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions:
								expect.objectContaining<ArgumentsAssociatedResourcesNotFoundExtensions>(
									{
										code: "arguments_associated_resources_not_found",
										issues: expect.arrayContaining<
											ArgumentsAssociatedResourcesNotFoundExtensions["issues"][number]
										>([
											{
												argumentPath: ["input", "id"],
											},
										]),
									},
								),
							message: expect.any(String),
							path: ["post"],
						}),
					]),
				);
			});
		},
	);
	suite(
		`results in a graphql error with "unauthenticated" extensions code in the "errors" field and "null" as the value of "data.post" field if`,
		() => {
			test("authenticated user exists in token but not in database.", async () => {
				const { userId, email, password } =
					await createTestUser("administrator");
				const signInResult = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress: email,
							password: password,
						},
					},
				});

				const authToken = signInResult.data?.signIn?.authenticationToken;
				if (!authToken)
					throw new Error(
						"Failed to get authentication token from sign-in result",
					);

				await server.drizzleClient
					.delete(usersTable)
					.where(eq(usersTable.id, userId));
				const result = await mercuriusClient.query(Query_post, {
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							id: uuidv7(),
						},
					},
				});
				expect(result.data.post).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions: expect.objectContaining<UnauthenticatedExtensions>({
								code: "unauthenticated",
							}),
							message: expect.any(String),
							path: ["post"],
						}),
					]),
				);
			});
		},
	);
	suite(
		`results in a graphql error with "unauthorized_action_on_arguments_associated_resources" extensions code in the "errors" field and "null" as the value of "data.post" field if`,
		() => {
			test("regular user attempts to access a post from an organization they are not a member of", async () => {
				// Create test user using the helper function
				const { email, password } = await createTestUser();
				// Create a different user's post
				const { postId } = await createTestPost(adminUserId);
				// Sign in with plain password
				const signInResult = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress: email,
							password: password,
						},
					},
				});
				const authToken = signInResult.data?.signIn?.authenticationToken;
				// validation for authentication token
				if (!authToken) {
					console.error(
						"SignIn Result:",
						JSON.stringify(signInResult, null, 2),
					);
					throw new Error("Failed to get authentication token");
				}
				// Attempt to access post
				const result = await mercuriusClient.query(Query_post, {
					headers: {
						authorization: `bearer ${authToken}`,
					},
					variables: {
						input: {
							id: postId,
						},
					},
				});
				expect(result.data.post).toEqual(null);
				expect(result.errors).toEqual(
					expect.arrayContaining<TalawaGraphQLFormattedError>([
						expect.objectContaining<TalawaGraphQLFormattedError>({
							extensions:
								expect.objectContaining<UnauthorizedActionOnArgumentsAssociatedResourcesExtensions>(
									{
										code: "unauthorized_action_on_arguments_associated_resources",
										issues: expect.arrayContaining([
											{
												argumentPath: ["input", "id"],
											},
										]),
									},
								),
							message: expect.any(String),
							path: ["post"],
						}),
					]),
				);
			});
		},
	);
});
