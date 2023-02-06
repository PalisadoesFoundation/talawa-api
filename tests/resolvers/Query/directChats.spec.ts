import "dotenv/config";
import { directChats as directChatsResolver } from "../../../src/resolvers/Query/directChats";
import { connect, disconnect } from "../../../src/db";
import { DirectChat } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestUser, createTestOrganizationWithAdmin } from "../../helpers/uerAndOrgs";
import { createTestDirectMessageForMultipleUser } from "../../helpers/directChat";
beforeAll(async () => {
  await connect();

  const testUser1 = await createTestUser();
  const testUser2 = await createTestUser();
  const testOrganization = await createTestOrganizationWithAdmin(testUser1._id);
  const testDirectChat = await createTestDirectMessageForMultipleUser(testUser1._id, testUser2._id, testOrganization._id);
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Query -> directChats", () => {
  it(`returns list of all existing directChats`, async () => {
    const directChatsPayload = await directChatsResolver?.({}, {}, {});

    const directChats = await DirectChat.find().lean();

    expect(directChatsPayload).toEqual(directChats);
  });
});
