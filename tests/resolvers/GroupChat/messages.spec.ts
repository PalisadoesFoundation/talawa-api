import "dotenv/config";
import { messages as messagesResolver } from "../../../src/resolvers/GroupChat/messages";
import { connect, disconnect } from "../../../src/db";
import { GroupChatMessage } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestGroupChat,
  testGroupChatType,
} from "../../helpers/groupChat";

let testGroupChat: testGroupChatType;

beforeAll(async () => {
  await connect();
  const resultArray = await createTestGroupChat();
  testGroupChat = resultArray[2];
});

afterAll(async () => {
  await disconnect();
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
