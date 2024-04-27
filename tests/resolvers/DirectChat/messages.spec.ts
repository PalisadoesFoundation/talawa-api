import "dotenv/config";
import { messages as messagesResolver } from "../../../src/resolvers/DirectChat/messages";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { DirectChatMessage } from "../../../src/models";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { TestDirectChatType } from "../../helpers/directChat";
import { createTestDirectChatMessage } from "../../helpers/directChat";

let testDirectChat: TestDirectChatType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const userOrgChat = await createTestDirectChatMessage();
  testDirectChat = userOrgChat[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> DirectChat -> messages", () => {
  it(`returns user object for parent.messages`, async () => {
    const parent = testDirectChat?.toObject();
    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    const messagesPayload = await messagesResolver?.(parent, {}, {});

    const messages = await DirectChatMessage.find({
      _id: {
        $in: testDirectChat?.messages,
      },
    }).lean();

    expect(messagesPayload).toEqual(messages);
  });
});
