import "dotenv/config";
import { messages as messagesResolver } from "../../../src/resolvers/DirectChat/messages";
import { connect, disconnect } from "../../../src/db";
import { DirectChatMessage } from "../../../src/models";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createTestDirectChatMessage,
  testDirectChatType,
} from "../../helpers/directChat";

let testDirectChat: testDirectChatType;

beforeAll(async () => {
  await connect();
  const userOrgChat = await createTestDirectChatMessage();
  testDirectChat = userOrgChat[2];
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> DirectChat -> messages", () => {
  it(`returns user object for parent.messages`, async () => {
    const parent = testDirectChat!.toObject();

    const messagesPayload = await messagesResolver?.(parent, {}, {});

    const messages = await DirectChatMessage.find({
      _id: {
        $in: testDirectChat!.messages,
      },
    }).lean();

    expect(messagesPayload).toEqual(messages);
  });
});
