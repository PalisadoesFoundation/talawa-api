import { faker } from "@faker-js/faker";
import { afterEach, expect, suite, test, vi } from "vitest";
import { assertToBeNonNullish } from "../../../helpers";
import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_createOrganization,
	Mutation_rejectMembershipRequest,
	Mutation_sendMembershipRequest,
} from "../documentNodes";

afterEach(() => {
	vi.clearAllMocks();
});

suite("rejectMembershipRequest", () => {
	suite("rejectMembershipRequest - unauthenticated", () => {
		test("should return an error with unauthenticated extensions code", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_rejectMembershipRequest,
				{
					variables: { input: { membershipRequestId: faker.string.uuid() } },
				},
			);
			expect(result.data?.rejectMembershipRequest ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["rejectMembershipRequest"],
					}),
				]),
			);
		});
	});

	suite("rejectMembershipRequest - invalid arguments", () => {
		test("should return an error with invalid_arguments code", async () => {
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
			assertToBeNonNullish(adminToken);
			const result = await mercuriusClient.mutate(
				Mutation_rejectMembershipRequest,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							membershipRequestId: "",
						},
					},
				},
			);
			expect(result.data?.rejectMembershipRequest ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "invalid_arguments" }),
						path: ["rejectMembershipRequest"],
					}),
				]),
			);
		});
	});

	suite("rejectMembershipRequest - membership request not found", () => {
		test("should return an error with arguments_associated_resources_not_found", async () => {
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
			assertToBeNonNullish(adminToken);

			const result = await mercuriusClient.mutate(
				Mutation_rejectMembershipRequest,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: { input: { membershipRequestId: faker.string.uuid() } },
				},
			);

			expect(result.data?.rejectMembershipRequest ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "arguments_associated_resources_not_found",
						}),
						path: ["rejectMembershipRequest"],
					}),
				]),
			);
		});
	});

	suite("rejectMembershipRequest - unauthorized action", () => {
		test("should return an error when current user is not admin", async () => {
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
			assertToBeNonNullish(adminToken);

			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: "Membership reject Test Organization",
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
				Mutation_rejectMembershipRequest,
				{
					headers: { authorization: `bearer ${userToken}` },
					variables: {
						input: { membershipRequestId },
					},
				},
			);

			expect(result.data?.rejectMembershipRequest ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({
							code: "unauthorized_action_on_arguments_associated_resources",
						}),
						path: ["rejectMembershipRequest"],
					}),
				]),
			);
		});
	});

	suite("Mutation field rejectMembershipRequest", () => {
		test("should accept a pending membership request and add the user to the organization", async () => {
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
			assertToBeNonNullish(adminToken);

			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: "Membership reject Test-2",
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
				Mutation_rejectMembershipRequest,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: { membershipRequestId },
					},
				},
			);

			expect(acceptResult.data?.rejectMembershipRequest).toEqual(
				expect.objectContaining({
					success: true,
					message: "Membership request rejected successfully.",
				}),
			);
		});

		suite("rejectMembershipRequest - request status not pending", () => {
			test("should return an error with forbidden_action code", async () => {
				const { accessToken: adminToken } = await getAdminAuthViaRest(server);
				assertToBeNonNullish(adminToken);

				const createOrgResult = await mercuriusClient.mutate(
					Mutation_createOrganization,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: {
								name: "Membership reject error",
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
					Mutation_rejectMembershipRequest,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: { membershipRequestId },
						},
					},
				);
				expect(result.data?.rejectMembershipRequest ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "forbidden_action",
								message: "You can only reject a pending membership request.",
							}),
							path: ["rejectMembershipRequest"],
						}),
					]),
				);
			});
		});
	});
	suite("rejectMembershipRequest - empty update result", () => {
		test("should return a specific error when update returns empty array", async () => {
			const { accessToken: adminToken } = await getAdminAuthViaRest(server);
			assertToBeNonNullish(adminToken);

			const createOrgResult = await mercuriusClient.mutate(
				Mutation_createOrganization,
				{
					headers: { authorization: `bearer ${adminToken}` },
					variables: {
						input: {
							name: "Empty Update ",
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

			const originalUpdate = server.drizzleClient.update;
			server.drizzleClient.update = vi.fn().mockReturnValue({
				set: () => ({
					where: () => ({
						returning: async () => [],
					}),
				}),
			});

			try {
				const result = await mercuriusClient.mutate(
					Mutation_rejectMembershipRequest,
					{
						headers: { authorization: `bearer ${adminToken}` },
						variables: {
							input: { membershipRequestId },
						},
					},
				);

				expect(result.data?.rejectMembershipRequest ?? null).toBeNull();
				expect(result.errors).toEqual(
					expect.arrayContaining([
						expect.objectContaining({
							extensions: expect.objectContaining({
								code: "unexpected",
								message: "Failed to reject the membership request.",
							}),
							path: ["rejectMembershipRequest"],
						}),
					]),
				);
			} finally {
				server.drizzleClient.update = originalUpdate;
			}
		});
	});
});
