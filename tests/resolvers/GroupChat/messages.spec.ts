import "dotenv/config";
import { messages as messagesResolver } from "../../../src/resolvers/GroupChat/messages";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { GroupChatMessage } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestGroupChat,
  TestGroupChatType,
} from "../../helpers/groupChat";

let testGroupChat: TestGroupChatType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestGroupChat();
  testGroupChat = resultArray[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> GroupChat -> messages", () => {
  it(`returns user objects for parent.messages`, async () => {
    const parent = testGroupChat!.toObject();

    const messagesPayload = await messagesResolver?.(parent, {}, {});

    const messages = await GroupChatMessage.find({
      _id: {
        $in: testGroupChat!.messages,
      },
    }).lean();

    expect(messagesPayload).toEqual(messages);
  });
});
