import "dotenv/config";
import { groupChatMessages as groupChatMessagesResolver } from "../../../src/resolvers/Query/groupChatMessages";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { GroupChatMessage } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestGroupChatMessage } from "../../helpers/groupChat";

let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await createTestGroupChatMessage();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
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
