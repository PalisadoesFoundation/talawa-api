import "dotenv/config";
import { groupChatMessages as groupChatMessagesResolver } from "../../../src/resolvers/Query/groupChatMessages";
import { connect, disconnect } from "../../../src/db";
import { GroupChatMessage } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestGroupChatMessage } from "../../helpers/groupChat";

beforeAll(async () => {
  await connect();
  await createTestGroupChatMessage();
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Query -> groupChatMessages", () => {
  it(`returns list of all existing groupChatMessages`, async () => {
    const groupChatMessagesPayload = await groupChatMessagesResolver?.(
      {},
      {},
      {}
    );

    const groupChatMessages = await GroupChatMessage.find().lean();

    expect(groupChatMessagesPayload).toEqual(groupChatMessages);
  });
});
