import { expect, suite, test , vi } from "vitest";
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


	suite("acceptMembershipRequest - empty update result", () => {
		test("should return a specific error when update returns empty array", async () => {
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
							name: "Empty Update Test Org",
							description: "Test organization for empty update array",
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

			const originalTransaction = server.drizzleClient.transaction;

			server.drizzleClient.transaction = vi
				.fn()
				.mockImplementation(async (fn) => {
					const fakeTx = {
						update: () => ({
							set: () => ({
								where: () => ({
									returning: async () => {
										return []; 
									},
								}),
							}),
						}),
						insert: originalTransaction,
					};
					return await fn(fakeTx);
				});

			try {
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
								code: "unexpected",
								message: "Failed to accept membership request and add user to organization.",
							}),
							path: ["acceptMembershipRequest"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.transaction = originalTransaction;
			}
		});
	});

	suite("acceptMembershipRequest - transaction error handling", () => {
		test("should handle transaction failures appropriately", async () => {
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

			const originalTransaction = server.drizzleClient.transaction;
			server.drizzleClient.transaction = async () => {
				throw new Error("Simulated transaction failure");
			};

			const result = await mercuriusClient.mutate(
				Mutation_acceptMembershipRequest,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: { membershipRequestId },
					},
				},
			);

			server.drizzleClient.transaction = originalTransaction;

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

			const verifyRequestResult = await mercuriusClient.mutate(
				Mutation_acceptMembershipRequest,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: { membershipRequestId },
					},
				},
			);

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
