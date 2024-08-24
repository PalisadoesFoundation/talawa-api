import type mongoose from "mongoose";
import { Types } from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chatById } from "../../../src/resolvers/Query/chatById";
import { createTestChat, type TestChatType } from "../../helpers/chat";
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
      id: testChat?._id,
    };
    const chatByIdPayload = await chatById?.({}, args, {});
    expect(chatByIdPayload).toEqual(testChat?.toObject());
  });
  it(`returns null if fund not found for args.id`, async () => {
    const args = {
      id: new Types.ObjectId().toString(),
    };
    const chatByIdPayload = await chatById?.({}, args, {});
    expect(chatByIdPayload).toEqual({});
  });
});
