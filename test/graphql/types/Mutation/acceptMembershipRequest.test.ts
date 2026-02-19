import { faker } from "@faker-js/faker";
import { expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_acceptMembershipRequest,
	Mutation_createOrganization,
	Mutation_rejectMembershipRequest,
	Mutation_sendMembershipRequest,
} from "../documentNodes";

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
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
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
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
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
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
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
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
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
				const { accessToken: adminToken } = await getAdminAuthViaRest(server);
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
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
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
								message:
									"Failed to accept membership request and add user to organization.",
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

	suite("acceptMembershipRequest - user already a member", () => {
		test("should return an error with forbidden_action code", async () => {
			// Sign in as admin
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
			assertToBeNonNullish(adminToken);

			// Create an organization
			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: "Already Member Test Org",
							description: "Test for already member scenario",
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

			// Create a regular user and get their token
			const { authToken: userToken, userId } =
				await createRegularUserUsingAdmin();
			assertToBeNonNullish(userToken);
			assertToBeNonNullish(userId);

			// Mock the membership check to make it appear the user is already a member
			const originalFindFirst =
				server.drizzleClient.query.organizationMembershipsTable.findFirst;
			server.drizzleClient.query.organizationMembershipsTable.findFirst = vi
				.fn()
				.mockImplementation(() => ({
					where: () => ({
						execute: async () => ({
							id: faker.string.uuid(),
							memberId: userId,
							organizationId: orgId,
							role: "regular",
							creatorId: faker.string.uuid(),
							createdAt: new Date(),
						}),
					}),
				}));

			try {
				// User sends a membership request
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

				// Admin tries to accept the request, but should fail due to existing membership
				const result = await mercuriusClient.mutate(
					Mutation_acceptMembershipRequest,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: { membershipRequestId },
						},
					},
				);

				// Assert the correct error is returned
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
			} finally {
				// Restore original function
				server.drizzleClient.query.organizationMembershipsTable.findFirst =
					originalFindFirst;
			}
		});
	});

	suite("acceptMembershipRequest - transaction error handling", () => {
		test("should handle transaction failures appropriately", async () => {
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
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
