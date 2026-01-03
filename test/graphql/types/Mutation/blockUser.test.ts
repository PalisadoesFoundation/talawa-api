import { faker } from "@faker-js/faker";
import { beforeAll, beforeEach, expect, suite, test } from "vitest";
import type { TalawaGraphQLFormattedError } from "~/src/utilities/TalawaGraphQLError";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Mutation_blockUser,
	Mutation_createOrganization,
	Mutation_createOrganizationMembership,
	Mutation_createUser,
	Query_signIn,
} from "../documentNodes";

async function getAdminToken() {
	const signInResult = await mercuriusClient.query(Query_signIn, {
		variables: {
			input: {
				emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
				password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
			},
		},
	});

	const authToken = signInResult.data?.signIn?.authenticationToken;
	assertToBeNonNullish(authToken);
	return authToken;
}

async function createTestUser(
	adminAuthToken: string,
	role: "regular" | "administrator" = "regular",
) {
	const userResult = await mercuriusClient.mutate(Mutation_createUser, {
		headers: {
			authorization: `bearer ${adminAuthToken}`,
		},
		variables: {
			input: {
				emailAddress: `${faker.string.uuid()}@test.com`,
				name: faker.person.fullName(),
				password: "password123",
				role: role,
				isEmailAddressVerified: false,
			},
		},
	});

	assertToBeNonNullish(userResult.data?.createUser);
	assertToBeNonNullish(userResult.data.createUser.user?.id);
	assertToBeNonNullish(userResult.data.createUser.authenticationToken);

	return {
		userId: userResult.data.createUser.user.id,
		authToken: userResult.data.createUser.authenticationToken,
	};
}

async function createTestOrganization(adminAuthToken: string) {
	const orgResult = await mercuriusClient.mutate(Mutation_createOrganization, {
		headers: {
			authorization: `bearer ${adminAuthToken}`,
		},
		variables: {
			input: {
				name: `Test Organization ${faker.string.uuid()}`,
				countryCode: "us",
			},
		},
	});

	assertToBeNonNullish(orgResult.data?.createOrganization);
	return orgResult.data.createOrganization.id;
}

async function createOrganizationMembership(
	adminAuthToken: string,
	memberId: string,
	organizationId: string,
	role: "regular" | "administrator" = "regular",
) {
	const membershipResult = await mercuriusClient.mutate(
		Mutation_createOrganizationMembership,
		{
			headers: {
				authorization: `bearer ${adminAuthToken}`,
			},
			variables: {
				input: {
					memberId,
					organizationId,
					role,
				},
			},
		},
	);

	assertToBeNonNullish(membershipResult.data?.createOrganizationMembership);
	return membershipResult.data.createOrganizationMembership.id;
}

suite("Mutation field blockUser", () => {
	let adminAuthToken = "";
	let organizationId = "";
	let regularUserId = "";
	let regularUserAuthToken = "";
	let adminUserId = "";

	beforeAll(async () => {
		adminAuthToken = await getAdminToken();

		const signInResult = await mercuriusClient.query(Query_signIn, {
			variables: {
				input: {
					emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
					password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
				},
			},
		});
		adminUserId = signInResult.data?.signIn?.user?.id ?? "";
		assertToBeNonNullish(adminUserId);
	});

	beforeEach(async () => {
		organizationId = await createTestOrganization(adminAuthToken);

		// Add admin as administrator member of the organization
		await createOrganizationMembership(
			adminAuthToken,
			adminUserId,
			organizationId,
			"administrator",
		);

		const regularUser = await createTestUser(adminAuthToken);
		regularUserId = regularUser.userId;
		regularUserAuthToken = regularUser.authToken;

		await createOrganizationMembership(
			adminAuthToken,
			regularUserId,
			organizationId,
		);
	});

	suite("when the client is not authenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_blockUser, {
				variables: {
					organizationId,
					userId: regularUserId,
				},
			});

			expect(result.data?.blockUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "unauthenticated",
						}),
						message: "You must be authenticated to perform this action.",
						path: ["blockUser"],
					}),
				]),
			);
		});
	});

	suite("when arguments are invalid", () => {
		test("should return an error with invalid_arguments code for empty organizationId", async () => {
			const result = await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					organizationId: "",
					userId: regularUserId,
				},
			});

			expect(result.data?.blockUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
						message: expect.any(String),
						path: ["blockUser"],
					}),
				]),
			);
		});

		test("should return an error with invalid_arguments code for empty userId", async () => {
			const result = await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					organizationId,
					userId: "",
				},
			});

			expect(result.data?.blockUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
						}),
						message: expect.any(String),
						path: ["blockUser"],
					}),
				]),
			);
		});
	});

	suite("when the organization does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					organizationId: faker.string.uuid(),
					userId: regularUserId,
				},
			});

			expect(result.data?.blockUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "organizationId"],
								}),
							]),
						}),
						message: expect.any(String),
						path: ["blockUser"],
					}),
				]),
			);
		});
	});

	suite("when the current user is not an admin", () => {
		test("should return an error with unauthorized_action extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${regularUserAuthToken}` },
				variables: {
					organizationId,
					userId: regularUserId,
				},
			});

			expect(result.data?.blockUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "unauthorized_action",
						}),
						message: expect.any(String),
						path: ["blockUser"],
					}),
				]),
			);
		});
	});

	suite("when the target user does not exist", () => {
		test("should return an error with arguments_associated_resources_not_found extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					organizationId,
					userId: faker.string.uuid(),
				},
			});

			expect(result.data?.blockUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "userId"],
								}),
							]),
						}),
						message: expect.any(String),
						path: ["blockUser"],
					}),
				]),
			);
		});
	});

	suite("when the user is already blocked", () => {
		test("should return an error with forbidden_action extensions code", async () => {
			await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					organizationId,
					userId: regularUserId,
				},
			});

			const result = await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					organizationId,
					userId: regularUserId,
				},
			});

			expect(result.data?.blockUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "forbidden_action",
							message: "User is already blocked from this organization.",
						}),
						message: expect.any(String),
						path: ["blockUser"],
					}),
				]),
			);
		});
	});

	suite("when the target user is not a member of the organization", () => {
		test("should return an error with forbidden_action extensions code", async () => {
			const nonMemberUser = await createTestUser(adminAuthToken);

			const result = await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					organizationId,
					userId: nonMemberUser.userId,
				},
			});

			expect(result.data?.blockUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "forbidden_action",
							message: "User is not a member of the organization.",
						}),
						message: expect.any(String),
						path: ["blockUser"],
					}),
				]),
			);
		});
	});

	suite("when the user tries to block themselves", () => {
		test("should return an error with forbidden_action extensions code", async () => {
			const result = await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					organizationId,
					userId: adminUserId,
				},
			});

			expect(result.data?.blockUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "forbidden_action",
							message: "You cannot block yourself.",
						}),
						message: expect.any(String),
						path: ["blockUser"],
					}),
				]),
			);
		});
	});

	suite("when trying to block an administrator", () => {
		test("should return an error with forbidden_action extensions code", async () => {
			const adminUser = await createTestUser(adminAuthToken, "administrator");
			await createOrganizationMembership(
				adminAuthToken,
				adminUser.userId,
				organizationId,
				"administrator",
			);

			const result = await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					organizationId,
					userId: adminUser.userId,
				},
			});

			expect(result.data?.blockUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "forbidden_action",
							message: "You cannot block an admin.",
						}),
						message: expect.any(String),
						path: ["blockUser"],
					}),
				]),
			);
		});
	});

	suite("when the admin user is not a member of the organization", () => {
		test("should return an error with forbidden_action extensions code", async () => {
			const nonMemberOrg = await createTestOrganization(adminAuthToken);

			const result = await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					organizationId: nonMemberOrg,
					userId: regularUserId,
				},
			});

			expect(result.data?.blockUser).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining<TalawaGraphQLFormattedError>([
					expect.objectContaining<TalawaGraphQLFormattedError>({
						extensions: expect.objectContaining({
							code: "forbidden_action",
							message: "User is not a member of the organization.",
						}),
						message: expect.any(String),
						path: ["blockUser"],
					}),
				]),
			);
		});
	});

	suite("when all conditions are met", () => {
		test("should successfully block the user and return true", async () => {
			const result = await mercuriusClient.mutate(Mutation_blockUser, {
				headers: { authorization: `bearer ${adminAuthToken}` },
				variables: {
					organizationId,
					userId: regularUserId,
				},
			});

			expect(result.data?.blockUser).toBe(true);
			expect(result.errors).toBeUndefined();
		});
	});
});
