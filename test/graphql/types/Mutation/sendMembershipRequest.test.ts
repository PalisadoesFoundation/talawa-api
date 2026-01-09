import { faker } from "@faker-js/faker";
import { expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_sendMembershipRequest,
	Query_signIn,
} from "../documentNodes";

suite("sendMembershipRequest", () => {
	suite("sendMembershipRequest - unauthenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_sendMembershipRequest,
				{
					variables: { input: { organizationId: faker.string.uuid() } },
				},
			);
			expect(result.data?.sendMembershipRequest ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["sendMembershipRequest"],
					}),
				]),
			);
		});
	});

	suite("sendMembershipRequest - invalid arguments", () => {
		test("should return an error with invalid_arguments code for empty organizationId", async () => {
			const signInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			const adminToken = signInResult.data?.signIn?.authenticationToken;
			assertToBeNonNullish(adminToken);

			const result = await mercuriusClient.mutate(
				Mutation_sendMembershipRequest,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							organizationId: "",
						},
					},
				},
			);
			expect(result.data?.sendMembershipRequest ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "invalid_arguments" }),
						path: ["sendMembershipRequest"],
					}),
				]),
			);
		});
	});

	suite("sendMembershipRequest - user not found", () => {
		test("should return an error with unauthenticated code when user doesn't exist", async () => {
			const signInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			const adminToken = signInResult.data?.signIn?.authenticationToken;
			assertToBeNonNullish(adminToken);

			// Mock the user query to return null
			const originalFindFirst = server.drizzleClient.query.usersTable.findFirst;
			server.drizzleClient.query.usersTable.findFirst = vi
				.fn()
				.mockResolvedValue(null);

			try {
				const result = await mercuriusClient.mutate(
					Mutation_sendMembershipRequest,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								organizationId: faker.string.uuid(),
							},
						},
					},
				);

				expect(result.data?.sendMembershipRequest ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({ code: "unauthenticated" }),
							path: ["sendMembershipRequest"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.query.usersTable.findFirst = originalFindFirst;
			}
		});
	});

	suite("sendMembershipRequest - organization not found", () => {
		test("should return an error with arguments_associated_resources_not_found", async () => {
			const signInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			const adminToken = signInResult.data?.signIn?.authenticationToken;
			assertToBeNonNullish(adminToken);

			const result = await mercuriusClient.mutate(
				Mutation_sendMembershipRequest,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { organizationId: faker.string.uuid() } },
				},
			);

			expect(result.data?.sendMembershipRequest ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["sendMembershipRequest"],
					}),
				]),
			);
		});
	});

	suite("sendMembershipRequest - existing request", () => {
		test("should return an error when user has already sent a membership request", async () => {
			const adminSignInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			const adminToken = adminSignInResult.data?.signIn?.authenticationToken;
			assertToBeNonNullish(adminToken);

			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: "Existing Request Test Org",
							description: "Organization for testing existing requests",
							countryCode: "us",
							state: "test",
							city: "test",
							postalCode: "12345",
							addressLine1: "Address 1",
							addressLine2: "Address 2",
							isUserRegistrationRequired: true,
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const { authToken: userToken } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToken);

			// Send first request successfully
			const firstRequestResult = await mercuriusClient.mutate(
				Mutation_sendMembershipRequest,
				{
					headers: { authorization: `bearer ${userToken}` },
					variables: {
						input: {
							organizationId: orgId,
						},
					},
				},
			);
			expect(firstRequestResult.data?.sendMembershipRequest).toBeDefined();

			// Try to send second request - should fail
			const result = await mercuriusClient.mutate(
				Mutation_sendMembershipRequest,
				{
					headers: { authorization: `bearer ${userToken}` },
					variables: {
						input: {
							organizationId: orgId,
						},
					},
				},
			);

			expect(result.data?.sendMembershipRequest ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "invalid_arguments",
							issues: expect.arrayContaining([
								expect.objectContaining({
									argumentPath: ["input", "organizationId"],
									message:
										"User has already sent a membership request to this organization.",
								}),
							]),
						}),
						path: ["sendMembershipRequest"],
					}),
				]),
			);
		});
	});

	suite(
		"sendMembershipRequest - organization does not require registration",
		() => {
			test("should return an error with forbidden_action code", async () => {
				const adminSignInResult = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});
				const adminToken = adminSignInResult.data?.signIn?.authenticationToken;
				assertToBeNonNullish(adminToken);

				const createOrgResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								name: "No Registration Required Org",
								description: "Organization that doesn't require registration",
								countryCode: "us",
								state: "test",
								city: "test",
								postalCode: "12345",
								addressLine1: "Address 1",
								addressLine2: "Address 2",
								isUserRegistrationRequired: false,
							},
						},
					},
				);
				const orgId = createOrgResult.data?.createOrganization?.id;
				assertToBeNonNullish(orgId);

				const { authToken: userToken } = await createRegularUserUsingAdmin();
				assertToBeNonNullish(userToken);

				const result = await mercuriusClient.mutate(
					Mutation_sendMembershipRequest,
					{
						headers: { authorization: `bearer ${userToken}` },
						variables: {
							input: {
								organizationId: orgId,
							},
						},
					},
				);

				expect(result.data?.sendMembershipRequest ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "forbidden_action",
								message:
									"This organization does not require registration, automatic approval logic should be handled here.",
							}),
							path: ["sendMembershipRequest"],
						}),
					]),
				);
			});
		},
	);

	suite("sendMembershipRequest - empty insert result", () => {
		test("should return an error when insert returns empty array", async () => {
			const adminSignInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			const adminToken = adminSignInResult.data?.signIn?.authenticationToken;
			assertToBeNonNullish(adminToken);

			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: "Empty Insert Test Org",
							description: "Test organization for empty insert array",
							countryCode: "us",
							state: "test",
							city: "test",
							postalCode: "12345",
							addressLine1: "Address 1",
							addressLine2: "Address 2",
							isUserRegistrationRequired: true,
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const { authToken: userToken } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToken);

			// Mock the insert to return empty array
			const originalInsert = server.drizzleClient.insert;
			server.drizzleClient.insert = vi.fn().mockReturnValue({
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([]),
				}),
			});

			try {
				const result = await mercuriusClient.mutate(
					Mutation_sendMembershipRequest,
					{
						headers: { authorization: `bearer ${userToken}` },
						variables: {
							input: {
								organizationId: orgId,
							},
						},
					},
				);

				expect(result.data?.sendMembershipRequest ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({ code: "unexpected" }),
							path: ["sendMembershipRequest"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.insert = originalInsert;
			}
		});
	});

	suite("sendMembershipRequest - null first element", () => {
		test("should return an error when first element of insert result is null", async () => {
			const adminSignInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			const adminToken = adminSignInResult.data?.signIn?.authenticationToken;
			assertToBeNonNullish(adminToken);

			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: "Null Element Test Org",
							description: "Test organization for null first element",
							countryCode: "us",
							state: "test",
							city: "test",
							postalCode: "12345",
							addressLine1: "Address 1",
							addressLine2: "Address 2",
							isUserRegistrationRequired: true,
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const { authToken: userToken } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToken);

			// Mock the insert to return array with null first element
			const originalInsert = server.drizzleClient.insert;
			server.drizzleClient.insert = vi.fn().mockReturnValue({
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([null]),
				}),
			});

			try {
				const result = await mercuriusClient.mutate(
					Mutation_sendMembershipRequest,
					{
						headers: { authorization: `bearer ${userToken}` },
						variables: {
							input: {
								organizationId: orgId,
							},
						},
					},
				);

				expect(result.data?.sendMembershipRequest ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({ code: "unexpected" }),
							path: ["sendMembershipRequest"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.insert = originalInsert;
			}
		});
	});

	suite("sendMembershipRequest - successful request", () => {
		test("should successfully send a membership request and emit notification", async () => {
			const adminSignInResult = await mercuriusClient.query(Query_signIn, {
				variables: {
					input: {
						emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
						password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
					},
				},
			});
			const adminToken = adminSignInResult.data?.signIn?.authenticationToken;
			assertToBeNonNullish(adminToken);

			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: "Successful Request Test Org",
							description: "Test organization for successful request",
							countryCode: "us",
							state: "test",
							city: "test",
							postalCode: "12345",
							addressLine1: "Address 1",
							addressLine2: "Address 2",
							isUserRegistrationRequired: true,
						},
					},
				},
			);
			const orgId = createOrgResult.data?.createOrganization?.id;
			assertToBeNonNullish(orgId);

			const { authToken: userToken } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToken);

			// Mock the notification event bus
			const mockEmitJoinRequestSubmitted = vi.fn();
			const { notificationEventBus } = await import(
				"~/src/graphql/types/Notification/EventBus/eventBus"
			);
			const originalEmit = notificationEventBus.emitJoinRequestSubmitted;
			notificationEventBus.emitJoinRequestSubmitted =
				mockEmitJoinRequestSubmitted;

			try {
				const result = await mercuriusClient.mutate(
					Mutation_sendMembershipRequest,
					{
						headers: { authorization: `bearer ${userToken}` },
						variables: {
							input: {
								organizationId: orgId,
							},
						},
					},
				);

				expect(result.data?.sendMembershipRequest).toEqual(
					expect.objectContaining({
						organizationId: orgId,
						status: "pending",
						membershipRequestId: expect.any(String),
					}),
				);

				// Verify notification was emitted
				expect(mockEmitJoinRequestSubmitted).toHaveBeenCalledWith(
					expect.objectContaining({
						requestId: expect.any(String),
						userId: expect.any(String),
						userName: expect.any(String),
						organizationId: orgId,
						organizationName: "Successful Request Test Org",
					}),
					expect.any(Object),
				);
			} finally {
				notificationEventBus.emitJoinRequestSubmitted = originalEmit;
			}
		});
	});
});
