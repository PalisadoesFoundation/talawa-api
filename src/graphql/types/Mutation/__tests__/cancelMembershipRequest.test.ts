import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { server } from "../../../../../test/server";
import { membershipRequestsTable } from "~/src/drizzle/tables/membershipRequests";
import { usersTable } from "~/src/drizzle/tables/users";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

beforeAll(async () => {
  await server.ready();
});

afterAll(async () => {
  await server.close();
});

const mutation = `
  mutation Cancel($input: MutationCancelMembershipRequestInput!) {
    cancelMembershipRequest(input: $input) {
      success
      message
    }
  }
`;

async function createUser(drizzle: any) {
  const id = randomUUID();
  await drizzle.insert(usersTable).values({
    id,
    emailAddress: `user_${id}@test.com`,
    role: "user",
    passwordHash: "dummy",
  });
  return id;
}

async function createMembershipRequest(drizzle: any, userId: string, status = "pending") {
  const requestId = randomUUID();
  await drizzle.insert(membershipRequestsTable).values({
    membershipRequestId: requestId,
    userId,
    organizationId: randomUUID(),
    status,
  });
  return requestId;
}

describe("Mutation.cancelMembershipRequest", () => {
  const url = "/graphql";
  const drizzle = server.drizzleClient;

  beforeEach(async () => {
    await drizzle.delete(membershipRequestsTable);
    await drizzle.delete(usersTable);
  });

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

  it("invalid_arguments for invalid UUID", async () => {
    const userId = await createUser(drizzle);

    const res = await server.inject({
      method: "POST",
      url,
      headers: { authorization: `Bearer ${userId}` },
      payload: {
        query: mutation,
        variables: { input: { membershipRequestId: "bad-uuid" } },
      },
    });

    expect(res.json().errors[0].extensions.code).toBe("invalid_arguments");
  });

  it("unexpected when membership request not found", async () => {
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

  it("forbidden_action if request is not pending", async () => {
    const userId = await createUser(drizzle);
    const reqId = await createMembershipRequest(drizzle, userId, "approved");

    const res = await server.inject({
      method: "POST",
      url,
      headers: { authorization: `Bearer ${userId}` },
      payload: {
        query: mutation,
        variables: { input: { membershipRequestId: reqId } },
      },
    });

    expect(res.json().errors[0].extensions.code).toBe("forbidden_action");
  });

  it("successfully cancels a pending request", async () => {
    const userId = await createUser(drizzle);
    const reqId = await createMembershipRequest(drizzle, userId, "pending");

    const res = await server.inject({
      method: "POST",
      url,
      headers: { authorization: `Bearer ${userId}` },
      payload: {
        query: mutation,
        variables: { input: { membershipRequestId: reqId } },
      },
    });

    expect(res.json().data.cancelMembershipRequest.success).toEqual(true);

    const row = await drizzle
      .select()
      .from(membershipRequestsTable)
      .where(eq(membershipRequestsTable.membershipRequestId, reqId));

    expect(row.length).toBe(0);
  });
});
