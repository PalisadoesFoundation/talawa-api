import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chatById } from "../../../src/resolvers/Query/chatById";
import {
  createTestChat,
  createTestChatMessage,
  createTestChatWithImage,
  type TestChatType,
} from "../../helpers/chat";
import { connect, disconnect } from "../../helpers/db";
let MONGOOSE_INSTANCE: typeof mongoose;
let testChat: TestChatType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestChat();
  testChat = temp[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});
describe("resolvers->Query->chatById", () => {
  it(`returns the chat with _id === args.id`, async () => {
    const args = {
      id: testChat?._id?.toString() ?? "",
    };
    const chatByIdPayload = await chatById?.({}, args, { apiRootUrl: "" });
    expect(chatByIdPayload).toEqual(testChat?.toObject());
  });
  it(`throws chat not found if chat not found for args.id`, async () => {
    try {
      const args = {
        id: new Types.ObjectId().toString(),
      };
      await chatById?.({}, args, {});
    } catch (error: unknown) {
      expect((error as Error).message).toEqual("Chat not found");
    }
  });
  it(`returns a group chat with image`, async () => {
    const [, , chat] = await createTestChatWithImage();
    const args = {
      id: chat?._id?.toString() ?? "",
    };
    const chatByIdPayload = await chatById?.({}, args, { apiRootUrl: "" });
    expect(chatByIdPayload).toEqual(chat?.toObject());
  });
  it(`returns a chat which contains media in chat messages`, async () => {
    const [, , chat] = await createTestChatMessage();
    const args = {
      id: chat?._id?.toString() ?? "",
    };
    const chatByIdPayload = await chatById?.({}, args, { apiRootUrl: "" });
    expect(chatByIdPayload).toEqual(chat?.toObject());
  });
});
