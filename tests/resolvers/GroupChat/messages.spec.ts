import "dotenv/config";
import { messages as messagesResolver } from "../../../src/resolvers/GroupChat/messages";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { GroupChatMessage } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestGroupChatType } from "../../helpers/groupChat";
import { createTestGroupChat } from "../../helpers/groupChat";

let testGroupChat: TestGroupChatType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestGroupChat();
  testGroupChat = resultArray[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> GroupChat -> messages", () => {
  it(`returns user objects for parent.messages`, async () => {
    const parent = testGroupChat?.toObject();
    if (!parent) {
      throw new Error("Parent object is undefined.");
    }
    const messagesPayload = await messagesResolver?.(parent, {}, {});

    const messages = await GroupChatMessage.find({
      _id: {
        $in: testGroupChat?.messages,
      },
    }).lean();

    expect(messagesPayload).toEqual(messages);
  });
});
