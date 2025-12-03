

import { faker } from "@faker-js/faker";
import { expect, suite, test } from "vitest";
import { gql } from "graphql-tag";
import { server } from "../../../server";
import { mercuriusClient } from "../client";
import { createRegularUserUsingAdmin } from "../createRegularUserUsingAdmin";
import {
    Mutation_sendMembershipRequest,
    Mutation_createOrganization,
    Query_signIn,
} from "../documentNodes";
import { membershipRequestsTable } from "~/src/drizzle/tables/membershipRequests";
import { eq } from "drizzle-orm";

const Mutation_cancelMembershipRequest = gql(`
  mutation Mutation_cancelMembershipRequest(
    $input: MutationCancelMembershipRequestInput!
  ) {
    cancelMembershipRequest(input: $input) {
      success
      message
    }
  }
`);
/** Helper to create a test organization */
async function createTestOrganization() {
    // sign in as admin
    const signInResult = await mercuriusClient.query(Query_signIn, {
        variables: {
            input: {
                emailAddress: server.envConfig.API_ADMINISTRATOR_USER_EMAIL_ADDRESS,
                password: server.envConfig.API_ADMINISTRATOR_USER_PASSWORD,
            },
        },
    });

    const adminToken = signInResult.data?.signIn?.authenticationToken;
    expect(adminToken).toBeDefined();
    // create org
    const createOrgResult = await mercuriusClient.mutate(
        Mutation_createOrganization,
        {
            headers: { authorization: `bearer ${adminToken}` },
            variables: {
                input: {
                    name: "TestOrg-" + Date.now(),
                    countryCode: "us",
                    isUserRegistrationRequired: true,
                },
            },
        },
    );

    const orgId = createOrgResult.data?.createOrganization?.id;
    expect(orgId).toBeDefined();

    return orgId;
}

suite("cancelMembershipRequest", () => {
    suite("cancelMembershipRequest - unauthenticated", () => {
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

    suite("cancelMembershipRequest - invalid arguments", () => {
        test("should return invalid_arguments for malformed UUID", async () => {
            const { authToken } = await createRegularUserUsingAdmin();
            expect(authToken).toBeDefined();

            const result = await mercuriusClient.mutate(
                Mutation_cancelMembershipRequest,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: { input: { membershipRequestId: "" } }, // invalid uuid
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

    suite("cancelMembershipRequest - membership request not found", () => {
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

    suite("cancelMembershipRequest - cross-user authorization", () => {
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

            const cancelRes = await mercuriusClient.mutate(
                Mutation_cancelMembershipRequest,
                {
                    headers: { authorization: `bearer ${userB.authToken}` },
                    variables: { input: { membershipRequestId: reqId } },
                },
            );

            // userB cannot cancel A's request → unexpected
            expect(cancelRes.data?.cancelMembershipRequest ?? null).toBeNull();
            expect(cancelRes.errors).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        extensions: expect.objectContaining({ code: "unexpected" }),
                    }),
                ]),
            );
            // verify request still exists
            const rows = await server.drizzleClient
                .select()
                .from(membershipRequestsTable)
                .where(eq(membershipRequestsTable.membershipRequestId, reqId));

            expect(rows.length).toBe(1);
        });
    });

    suite("cancelMembershipRequest - forbidden when not pending", () => {
        test("should return forbidden_action for non-pending status", async () => {
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
            // update status to approved manually
            await server.drizzleClient
                .update(membershipRequestsTable)
                .set({ status: "approved" })
                .where(eq(membershipRequestsTable.membershipRequestId, reqId));

            const cancelRes = await mercuriusClient.mutate(
                Mutation_cancelMembershipRequest,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: { input: { membershipRequestId: reqId } },
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
        });
    });

    suite("cancelMembershipRequest - forbidden when not pending", () => {
        test("should return forbidden_action for non-pending status", async () => {
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
            // update status to approved manually
            await server.drizzleClient
                .update(membershipRequestsTable)
                .set({ status: "approved" })
                .where(eq(membershipRequestsTable.membershipRequestId, reqId));

            const cancelRes = await mercuriusClient.mutate(
                Mutation_cancelMembershipRequest,
                {
                    headers: { authorization: `bearer ${authToken}` },
                    variables: { input: { membershipRequestId: reqId } },
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
                .where(eq(membershipRequestsTable.membershipRequestId, reqId));

            expect(rows.length).toBe(1);
            expect(rows[0]!.status).toBe("approved");
        });
    });

});
