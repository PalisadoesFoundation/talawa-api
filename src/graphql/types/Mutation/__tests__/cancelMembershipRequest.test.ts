// ---------------------------------------------------------
// IMPORTS
// ---------------------------------------------------------
import { describe, it, expect, beforeEach } from "vitest";
import { server } from "../../../../../test/server";
import { membershipRequestsTable } from "~/src/drizzle/tables/membershipRequests";
import { usersTable } from "~/src/drizzle/tables/users";
import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
// Correct type: Use the actual drizzle client instance type
type DrizzleClient = typeof server.drizzleClient;
// ---------------------------------------------------------
// GRAPHQL MUTATION
// ---------------------------------------------------------
const mutation = `
  mutation Cancel($input: MutationCancelMembershipRequestInput!) {
    cancelMembershipRequest(input: $input) {
      success
      message
    }
  }
`;
// ---------------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------------
async function createUser(drizzle: DrizzleClient) {
  const id = randomUUID();
  // MINIMUM REQUIRED FIELDS based on usersTable schema
  await drizzle.insert(usersTable).values({
    id,
    emailAddress: `user_${id}@test.com`,
    name: `User ${id}`,
    isEmailAddressVerified: false,
    passwordHash: "dummy",
    role: "regular", // must exist in enum
  });
  return id;
}

async function createMembershipRequest(
  drizzle: DrizzleClient,
  userId: string,
  status: "pending" | "approved" | "rejected" = "pending"
) {
  const requestId = randomUUID();
  await drizzle.insert(membershipRequestsTable).values({
    membershipRequestId: requestId,
    userId,
    organizationId: randomUUID(),
    status,
  });

  return requestId;
}
// ---------------------------------------------------------
// TEST SUITE
// ---------------------------------------------------------
describe("Mutation.cancelMembershipRequest", () => {
  const url = "/graphql";
  const drizzle: DrizzleClient = server.drizzleClient;

  beforeEach(async () => {
    await drizzle.delete(membershipRequestsTable);
    await drizzle.delete(usersTable);
  });
  // ---------------------------------------------------------
  // Test: Unauthenticated access
  // ---------------------------------------------------------
  it("returns unauthenticated if no Authorization header is provided", async () => {
    const res = await server.inject({
      method: "POST",
      url,
      payload: {
        query: mutation,
        variables: { input: { membershipRequestId: randomUUID() } },
      },
    });

    expect(res.json().errors[0].extensions.code).toBe("unauthenticated");
  });
  // ---------------------------------------------------------
  // Test: Invalid UUID input
  // ---------------------------------------------------------
  it("returns invalid_arguments when membershipRequestId is not a valid UUID", async () => {
    const userId = await createUser(drizzle); // real user for future-proofing

    const res = await server.inject({
      method: "POST",
      url,
      headers: { authorization: `Bearer ${userId}` },
      payload: {
        query: mutation,
        variables: { input: { membershipRequestId: "invalid-uuid" } },
      },
    });

    expect(res.json().errors[0].extensions.code).toBe("invalid_arguments");
  });
  // ---------------------------------------------------------
  // Test: Membership request does not exist
  // ---------------------------------------------------------
  it("returns unexpected when membership request does not exist", async () => {
    const userId = await createUser(drizzle);
    const res = await server.inject({
      method: "POST",
      url,
      headers: { authorization: `Bearer ${userId}` },
      payload: {
        query: mutation,
        variables: { input: { membershipRequestId: randomUUID() } },
      },
    });

    expect(res.json().errors[0].extensions.code).toBe("unexpected");
  });
  // ---------------------------------------------------------
  // Test: Non-pending request
  // ---------------------------------------------------------
  it("returns forbidden_action when request status is not pending", async () => {
    const userId = await createUser(drizzle);
    const requestId = await createMembershipRequest(drizzle, userId, "approved");
    const res = await server.inject({
      method: "POST",
      url,
      headers: { authorization: `Bearer ${userId}` },
      payload: {
        query: mutation,
        variables: { input: { membershipRequestId: requestId } },
      },
    });

    expect(res.json().errors[0].extensions.code).toBe("forbidden_action");
  });
  // ---------------------------------------------------------
  // Test: User cannot cancel another user's membership request
  // ---------------------------------------------------------
  it("returns unexpected when user tries to cancel another user's membership request", async () => {
    const userA = await createUser(drizzle);
    const userB = await createUser(drizzle);
    const requestId = await createMembershipRequest(drizzle, userA);
    const res = await server.inject({
      method: "POST",
      url,
      headers: { authorization: `Bearer ${userB}` },
      payload: {
        query: mutation,
        variables: { input: { membershipRequestId: requestId } },
      },
    });
    expect(res.json().errors[0].extensions.code).toBe("unexpected");
    const result = await drizzle
      .select()
      .from(membershipRequestsTable)
      .where(eq(membershipRequestsTable.membershipRequestId, requestId));

    expect(result.length).toBe(1);
  });
  // ---------------------------------------------------------
  // Test: Successful cancellation
  // ---------------------------------------------------------
  it("successfully cancels a pending membership request", async () => {
    const userId = await createUser(drizzle);
    const requestId = await createMembershipRequest(drizzle, userId);
    const res = await server.inject({
      method: "POST",
      url,
      headers: { authorization: `Bearer ${userId}` },
      payload: {
        query: mutation,
        variables: { input: { membershipRequestId: requestId } },
      },
    });
    const body = res.json();
    expect(body.data.cancelMembershipRequest.success).toBe(true);
    const result = await drizzle
      .select()
      .from(membershipRequestsTable)
      .where(eq(membershipRequestsTable.membershipRequestId, requestId));

    expect(result.length).toBe(0);
  });
});
