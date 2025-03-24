import { expect, suite, test, vi } from "vitest";
import { faker } from "@faker-js/faker";
import { assertToBeNonNullish } from "../../../helpers";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import {
	Query_signIn,
	Mutation_createOrganization,
	Mutation_sendMembershipRequest,
	Mutation_rejectMembershipRequest,
	Mutation_acceptMembershipRequest,
} from "../documentNodes";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";

suite("acceptMembershipRequest", () => {
	suite("acceptMembershipRequest - unauthenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_acceptMembershipRequest,
				{
					variables: { input: { membershipRequestId: faker.string.uuid() } },
				},
			);
			expect(result.data?.acceptMembershipRequest ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["acceptMembershipRequest"],
					}),
				]),
			);
		});
	});

	suite("acceptMembershipRequest - invalid arguments", () => {
		test("should return an error with invalid_arguments code", async () => {
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
				Mutation_acceptMembershipRequest,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							membershipRequestId: "",
						},
					},
				},
			);
			expect(result.data?.acceptMembershipRequest ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "invalid_arguments" }),
						path: ["acceptMembershipRequest"],
					}),
				]),
			);
		});
	});

	suite("acceptMembershipRequest - membership request not found", () => {
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
				Mutation_acceptMembershipRequest,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { membershipRequestId: faker.string.uuid() } },
				},
			);

			expect(result.data?.acceptMembershipRequest ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["acceptMembershipRequest"],
					}),
				]),
			);
		});
	});

	// --- Test 4: Unauthorized action (user not admin) ---
	suite("acceptMembershipRequest - unauthorized action", () => {
		test("should return an error when current user is not admin", async () => {
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
							name: "Membership Test Org",
							description: "Organization requiring registration",
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
			console.log("orgId: ", orgId);

			const { authToken: userToken } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToken);

			const sendRequestResult = await mercuriusClient.mutate(
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
			const membershipRequest = sendRequestResult.data?.sendMembershipRequest;
			assertToBeNonNullish(membershipRequest);
			const membershipRequestId = membershipRequest.membershipRequestId;
			assertToBeNonNullish(membershipRequestId);

			const result = await mercuriusClient.mutate(
				Mutation_acceptMembershipRequest,
				{
					headers: { authorization: `bearer ${userToken}` },
					variables: {
						input: { membershipRequestId },
					},
				},
			);

			expect(result.data?.acceptMembershipRequest ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
						path: ["acceptMembershipRequest"],
					}),
				]),
			);
		});
	});

	suite("Mutation field acceptMembershipRequest", () => {
		test("should accept a pending membership request and add the user to the organization", async () => {
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
							name: "Membership Test",
							description: "Organization registration",
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

			const sendRequestResult = await mercuriusClient.mutate(
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
			const membershipRequest = sendRequestResult.data?.sendMembershipRequest;
			assertToBeNonNullish(membershipRequest);
			const membershipRequestId = membershipRequest.membershipRequestId;
			assertToBeNonNullish(membershipRequestId);

			const acceptResult = await mercuriusClient.mutate(
				Mutation_acceptMembershipRequest,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: { membershipRequestId },
					},
				},
			);

			expect(acceptResult.data?.acceptMembershipRequest).toEqual(
				expect.objectContaining({
					success: true,
					message:
						"Membership request accepted successfully. User added to organization.",
				}),
			);
		});

		suite("acceptMembershipRequest - request status not pending", () => {
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
								name: "Membership Test error",
								description: "Organization error",
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

				const sendRequestResult = await mercuriusClient.mutate(
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
				const membershipRequest = sendRequestResult.data?.sendMembershipRequest;
				assertToBeNonNullish(membershipRequest);
				const membershipRequestId = membershipRequest.membershipRequestId;
				assertToBeNonNullish(membershipRequestId);

				const rejectResult = await mercuriusClient.mutate(
					Mutation_rejectMembershipRequest,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: { membershipRequestId },
						},
					},
				);
				expect(rejectResult.data?.rejectMembershipRequest).toBeDefined();

				const result = await mercuriusClient.mutate(
					Mutation_acceptMembershipRequest,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: { membershipRequestId },
						},
					},
				);
				expect(result.data?.acceptMembershipRequest ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "forbidden_action",
								message: "You can only accept a pending membership request.",
							}),
							path: ["acceptMembershipRequest"],
						}),
					]),
				);
			});
		});
	});

	// Test for checking if user is already a member of the organization
	suite("acceptMembershipRequest - user already a member", () => {
		test("should return an error with forbidden_action code", async () => {
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
							name: "IITbh Organization",
							description: "Organization-IITbh",
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

			const sendRequestResult = await mercuriusClient.mutate(
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
			const membershipRequest = sendRequestResult.data?.sendMembershipRequest;
			assertToBeNonNullish(membershipRequest);
			const membershipRequestId = membershipRequest.membershipRequestId;
			assertToBeNonNullish(membershipRequestId);

			// Accept the membership request first time
			await mercuriusClient.mutate(Mutation_acceptMembershipRequest, {
				headers: { authorization: `bearer ${adminToken}` },
				variables: {
					input: { membershipRequestId },
				},
			});

			// Create another membership request (or simulate one)
			const sendRequestResult2 = await mercuriusClient.mutate(
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
			const membershipRequest2 = sendRequestResult2.data?.sendMembershipRequest;
			assertToBeNonNullish(membershipRequest2);
			const membershipRequestId2 = membershipRequest2.membershipRequestId;
			assertToBeNonNullish(membershipRequestId2);

			// Try to accept the second request
			const result = await mercuriusClient.mutate(
				Mutation_acceptMembershipRequest,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: { membershipRequestId: membershipRequestId2 },
					},
				},
			);

			expect(result.data?.acceptMembershipRequest ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "forbidden_action",
							message: "The user is already a member of this organization.",
						}),
						path: ["acceptMembershipRequest"],
					}),
				]),
			);
		});
	});

	// Uncomment and update Test 7 for transaction returning empty updatedRequest
	suite(
		"acceptMembershipRequest - transaction returns no updated request",
		() => {
			test("should return an error with unexpected extensions code", async () => {
				// Sign in as admin.
				const signInResult = await mercuriusClient.query(Query_signIn, {
					variables: {
						input: {
							emailAddress:
								server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
							password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
						},
					},
				});
				const adminToken = signInResult.data?.signIn?.authenticationToken;
				assertToBeNonNullish(adminToken);

				// Use a valid UUID format instead of "test-request-id"
				const mockMembershipRequestId = faker.string.uuid();

				// Override membershipRequestsTable.findFirst to simulate a valid pending request.
				const originalFindFirstMR =
					server.drizzleClient.query.membershipRequestsTable.findFirst;
				server.drizzleClient.query.membershipRequestsTable.findFirst = vi
					.fn()
					.mockImplementation(() => {
						return {
							where: () => ({
								execute: async () => ({
									membershipRequestId: mockMembershipRequestId,
									status: "pending",
									organization: {
										name: "Test Org",
										membershipsWhereOrganization: [{ role: "administrator" }],
										organizationId: faker.string.uuid(),
									},
									userId: faker.string.uuid(),
								}),
							}),
						};
					});

				// Ensure no existing membership.
				const originalFindFirstOM =
					server.drizzleClient.query.organizationMembershipsTable.findFirst;
				server.drizzleClient.query.organizationMembershipsTable.findFirst = vi
					.fn()
					.mockImplementation(() => ({
						where: () => ({
							execute: async () => null,
						}),
					}));

				// Override transaction to simulate update returning empty.
				const originalTransaction = server.drizzleClient.transaction;
				server.drizzleClient.transaction = vi
					.fn()
					.mockImplementation(async (fn) => {
						const fakeTx = {
							update: () => ({
								set: () => ({
									where: () => ({
										returning: async () => {
											return []; // Simulate update returning no rows.
										},
									}),
								}),
							}),
							insert: () => ({
								values: () => ({
									returning: async () => {
										return [{ dummy: "value" }];
									},
								}),
							}),
						};
						return await fn(fakeTx);
					});

				const result = await mercuriusClient.mutate(
					Mutation_acceptMembershipRequest,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: { membershipRequestId: mockMembershipRequestId },
						},
					},
				);

				// Restore original methods.
				server.drizzleClient.query.membershipRequestsTable.findFirst =
					originalFindFirstMR;
				server.drizzleClient.query.organizationMembershipsTable.findFirst =
					originalFindFirstOM;
				server.drizzleClient.transaction = originalTransaction;

				expect(result.data?.acceptMembershipRequest ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unexpected",
								message: "Failed to accept the membership request.",
							}),
							path: ["acceptMembershipRequest"],
						}),
					]),
				);
			});
		},
	);
	// --- Test 8: Transaction throws an error in catch block ---
	suite("acceptMembershipRequest - transaction error handling", () => {
		test("should handle transaction failures appropriately", async () => {
			// Sign in as admin
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

			// Create a test organization
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: "Test Transaction Org",
							description: "Test organization for transaction error",
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

			// Create a regular user and send membership request
			const { authToken: userToken } = await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToken);

			const sendRequestResult = await mercuriusClient.mutate(
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
			const membershipRequest = sendRequestResult.data?.sendMembershipRequest;
			assertToBeNonNullish(membershipRequest);
			const membershipRequestId = membershipRequest.membershipRequestId;
			assertToBeNonNullish(membershipRequestId);

			// Mock the transaction to simulate a failure
			const originalTransaction = server.drizzleClient.transaction;
			server.drizzleClient.transaction = async () => {
				throw new Error("Simulated transaction failure");
			};

			// Attempt to accept the membership request
			const result = await mercuriusClient.mutate(
				Mutation_acceptMembershipRequest,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: { membershipRequestId },
					},
				},
			);

			// Restore original transaction
			server.drizzleClient.transaction = originalTransaction;

			// Verify error response
			expect(result.data?.acceptMembershipRequest ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unexpected",
							message:
								"Failed to accept membership request and add user to organization.",
						}),
						path: ["acceptMembershipRequest"],
					}),
				]),
			);

			// Verify the membership request remains in pending state
			const verifyRequestResult = await mercuriusClient.mutate(
				Mutation_acceptMembershipRequest,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: { membershipRequestId },
					},
				},
			);

			// Should be able to accept it now since it's still pending
			expect(verifyRequestResult.data?.acceptMembershipRequest).toEqual(
				expect.objectContaining({
					success: true,
					message:
						"Membership request accepted successfully. User added to organization.",
				}),
			);
		});
	});
});
