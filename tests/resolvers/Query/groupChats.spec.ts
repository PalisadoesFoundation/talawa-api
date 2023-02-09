import "dotenv/config";
import { groupChats as groupChatsResolver } from "../../../src/resolvers/Query/groupChats";
import { connect, disconnect } from "../../../src/db";
import { GroupChat } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestGroupChat } from "../../helpers/groupChat";

beforeAll(async () => {
  await connect();
  const [testUser, testOrganization, testGroupChat] = createTestGroupChat()
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Query -> groupChats", () => {
  it(`returns list of all existing groupChats`, async () => {
    const groupChatsPayload = await groupChatsResolver?.({}, {}, {});

    const groupChats = await GroupChat.find().lean();

    expect(groupChatsPayload).toEqual(groupChats);
  });
});
