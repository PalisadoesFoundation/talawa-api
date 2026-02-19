import { faker } from "@faker-js/faker";
import { eq } from "drizzle-orm";
import { expect, suite, test } from "vitest";

import { membershipRequestsTable } from "~/src/drizzle/tables/membershipRequests";

import { getAdminAuthViaRest } from "../../../helpers/adminAuthRest";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
	Mutation_cancelMembershipRequest,
	Mutation_createOrganization,
	Mutation_sendMembershipRequest,
} from "../documentNodes";

/** Helper to create an organization */
async function createTestOrganization() {
	const { accessToken: adminToken } = await getAdminAuthViaRest(server);
	expect(adminToken).toBeDefined();

	const createOrgResult = await mercuriusClient.mutate(
		Mutation_createOrganization,
		{
			headers: { authorization: `bearer ${adminToken}` },
			variables: {
				input: {
					name: `TestOrg-${Date.now()}`,
					countryCode: "us",
					isUserRegistrationRequired: true,
				},
			},
		},
	);

	expect(createOrgResult.errors ?? []).toEqual([]);

	const orgId = createOrgResult.data?.createOrganization?.id;
	expect(orgId).toBeDefined();

	return orgId as string;
}

suite("cancelMembershipRequest", () => {
	// UNAUTHENTICATED
	suite("unauthenticated", () => {
		test("should return unauthenticated error", async () => {
			const result = await mercuriusClient.mutate(
				Mutation_cancelMembershipRequest,
				{
					variables: {
						input: { membershipRequestId: faker.string.uuid() },
					},
				},
			);

			expect(result.data?.cancelMembershipRequest ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unauthenticated" }),
						path: ["cancelMembershipRequest"],
					}),
				]),
			);
		});
	});

	// INVALID ARGUMENTS
	suite("invalid arguments", () => {
		test("should return invalid_arguments for malformed UUID", async () => {
			const { authToken } = await createRegularUserUsingAdmin();

			const result = await mercuriusClient.mutate(
				Mutation_cancelMembershipRequest,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { membershipRequestId: "" } },
				},
			);

			expect(result.data?.cancelMembershipRequest ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "invalid_arguments" }),
						path: ["cancelMembershipRequest"],
					}),
				]),
			);
		});
	});

	// REQUEST DOES NOT EXIST
	suite("membership request not found", () => {
		test("should return unexpected for nonexistent membership request", async () => {
			const { authToken } = await createRegularUserUsingAdmin();

			const result = await mercuriusClient.mutate(
				Mutation_cancelMembershipRequest,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: {
						input: { membershipRequestId: faker.string.uuid() },
					},
				},
			);

			expect(result.data?.cancelMembershipRequest ?? null).toBeNull();
			expect(result.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unexpected" }),
						path: ["cancelMembershipRequest"],
					}),
				]),
			);
		});
	});

	// CROSS-USER AUTHORIZATION
	suite("cross-user authorization", () => {
		test("User B cannot cancel User A's membership request", async () => {
			const userA = await createRegularUserUsingAdmin();
			const userB = await createRegularUserUsingAdmin();
			const orgId = await createTestOrganization();

			const sendRes = await mercuriusClient.mutate(
				Mutation_sendMembershipRequest,
				{
					headers: { authorization: `bearer ${userA.authToken}` },
					variables: { input: { organizationId: orgId } },
				},
			);

			const reqId = sendRes.data?.sendMembershipRequest?.membershipRequestId;
			expect(reqId).toBeDefined();
			const id: string = reqId as string;

			const cancelRes = await mercuriusClient.mutate(
				Mutation_cancelMembershipRequest,
				{
					headers: { authorization: `bearer ${userB.authToken}` },
					variables: { input: { membershipRequestId: id } },
				},
			);

			expect(cancelRes.data?.cancelMembershipRequest ?? null).toBeNull();
			expect(cancelRes.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "unexpected" }),
					}),
				]),
			);

			const rows = await server.drizzleClient
				.select()
				.from(membershipRequestsTable)
				.where(eq(membershipRequestsTable.membershipRequestId, id));

			expect(rows.length).toBe(1);
		});
	});

	// FORBIDDEN WHEN NOT PENDING
	suite("forbidden when not pending", () => {
		test("should return forbidden_action for non-pending request", async () => {
			const { authToken } = await createRegularUserUsingAdmin();
			const orgId = await createTestOrganization();

			const sendRes = await mercuriusClient.mutate(
				Mutation_sendMembershipRequest,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { organizationId: orgId } },
				},
			);

			const reqId = sendRes.data?.sendMembershipRequest?.membershipRequestId;
			expect(reqId).toBeDefined();
			const id: string = reqId as string;

			await server.drizzleClient
				.update(membershipRequestsTable)
				.set({ status: "approved" })
				.where(eq(membershipRequestsTable.membershipRequestId, id));

			const cancelRes = await mercuriusClient.mutate(
				Mutation_cancelMembershipRequest,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { membershipRequestId: id } },
				},
			);

			expect(cancelRes.data?.cancelMembershipRequest ?? null).toBeNull();
			expect(cancelRes.errors).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						extensions: expect.objectContaining({ code: "forbidden_action" }),
					}),
				]),
			);

			const rows = await server.drizzleClient
				.select()
				.from(membershipRequestsTable)
				.where(eq(membershipRequestsTable.membershipRequestId, id));

			expect(rows.length).toBe(1);
			expect(rows[0]?.status).toBe("approved");
		});
	});

	// SUCCESS
	suite("success", () => {
		test("should cancel and delete a pending request", async () => {
			const { authToken } = await createRegularUserUsingAdmin();
			const orgId = await createTestOrganization();

			const sendRes = await mercuriusClient.mutate(
				Mutation_sendMembershipRequest,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { organizationId: orgId } },
				},
			);

			const reqId = sendRes.data?.sendMembershipRequest?.membershipRequestId;
			expect(reqId).toBeDefined();
			const id: string = reqId as string;

			const cancelRes = await mercuriusClient.mutate(
				Mutation_cancelMembershipRequest,
				{
					headers: { authorization: `bearer ${authToken}` },
					variables: { input: { membershipRequestId: id } },
				},
			);

			expect(cancelRes.data?.cancelMembershipRequest?.success).toBe(true);
			expect(cancelRes.errors).toBeUndefined();

			const rows = await server.drizzleClient
				.select()
				.from(membershipRequestsTable)
				.where(eq(membershipRequestsTable.membershipRequestId, id));

			expect(rows.length).toBe(0);
		});
	});
});
