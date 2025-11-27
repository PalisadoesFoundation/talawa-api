import { describe, it, expect, beforeEach } from "vitest";
import { server } from "../../../server";
import { randomUUID } from "crypto";
import { membershipRequestsTable } from "~/src/drizzle/tables/membershipRequests";
import { usersTable } from "~/src/drizzle/tables/users";
import { eq } from "drizzle-orm";

const mutation = `
  mutation Cancel($input: MutationCancelMembershipRequestInput!) {
    cancelMembershipRequest(input: $input) {
      success
      message
    }
  }
`;

async function createUser(drizzle:any, overrides: any = {}) {
  const id = randomUUID();
  await drizzle.insert(usersTable).values({
    id,
    emailAddress: overrides.email ?? `user_${id}@test.com`,
    role: "user",
    passwordHash: "dummy",
  });
  return id;
}

async function createMembershipRequest(drizzle:any, userId: string, status = "pending") {
  const membershipRequestId = randomUUID();
  await drizzle.insert(membershipRequestsTable).values({
    membershipRequestId,
    userId,
    organizationId: randomUUID(),
    status,
  });
  return membershipRequestId;
}

describe("Mutation.cancelMembershipRequest", () => {
  const url = "/graphql";
  const drizzle = server.drizzleClient;

  beforeEach(async () => {
    await drizzle.delete(membershipRequestsTable);
    await drizzle.delete(usersTable);
  });

  // initially i am checking for user is loggedin or not

  it("unauthenticated if no Authorization header", async () => {
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

// than is their any false data sent by user

  it("invalid_arguments for non-UUID input", async () => {
    const userId = randomUUID(); 

    const res = await server.inject({
      method: "POST",
      url,
      headers: {
        authorization: `Bearer ${userId}`,
      },
      payload: {
        query: mutation,
        variables: { input: { membershipRequestId: "bad-uuid" } },
      },
    });

    expect(res.json().errors[0].extensions.code).toBe("invalid_arguments");
  });

// no membership found

  it(" unexpected when request not found", async () => {
    const userId = await createUser(drizzle);

    const res = await server.inject({
      method: "POST",
      url,
      headers: {
        authorization: `Bearer ${userId}`,
      },
      payload: {
        query: mutation,
        variables: { input: { membershipRequestId: randomUUID() } },
      },
    });

    expect(res.json().errors[0].extensions.code).toBe("unexpected");
  });

// membership already ended

  it(" forbidden_action when membership request is not pending", async () => {
    const userId = await createUser(drizzle);
    const requestId = await createMembershipRequest(drizzle, userId, "approved");

    const res = await server.inject({
      method: "POST",
      url,
      headers: {
        authorization: `Bearer ${userId}`,
      },
      payload: {
        query: mutation,
        variables: { input: { membershipRequestId: requestId } },
      },
    });

    expect(res.json().errors[0].extensions.code).toBe("forbidden_action");
  });

  // final check when found all case correct we cancel their membership

  it("cancels pending request successfully", async () => {
    const userId = await createUser(drizzle);
    const requestId = await createMembershipRequest(drizzle, userId, "pending");

    const res = await server.inject({
      method: "POST",
      url,
      headers: {
        authorization: `Bearer ${userId}`,
      },
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
