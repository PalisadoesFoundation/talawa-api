import "dotenv/config";
import { chatMessageBelongsTo as chatMessageBelongsToResolver } from "../../../src/resolvers/ChatMessage/chatMessageBelongsTo";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { Chat } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type { TestChatMessageType } from "../../helpers/chat";
import { createTestChatMessage } from "../../helpers/chat";
import { Types } from "mongoose";
import { CHAT_NOT_FOUND_ERROR } from "../../../src/constants";

let testChatMessage: TestChatMessageType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestChatMessage();
  testChatMessage = temp[3];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> DirectChatMessage -> directChatMessageBelongsTo", () => {
  it(`returns directChat object for parent.directChatMessageBelongsTo`, async () => {
    const parent = testChatMessage?.toObject();

    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    if (typeof chatMessageBelongsToResolver !== "function") {
      throw new Error("chatMessageBelongsToResolver is not a function.");
    }

    const chatMessageBelongsToPayload = await chatMessageBelongsToResolver(
      parent,
      {},
      {},
    );

    const chatMessageBelongsTo = await Chat.findOne({
      _id: testChatMessage?.chatMessageBelongsTo,
    }).lean();

    expect(chatMessageBelongsToPayload).toEqual(chatMessageBelongsTo);
  });
  it(`throws NotFoundError if no directChat exists`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message: string) => message);

    const parent = {
      ...testChatMessage?.toObject(),
      chatMessageBelongsTo: new Types.ObjectId(), // Set to a non-existing ObjectId
    };

    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    if (typeof chatMessageBelongsToResolver !== "function") {
      throw new Error("chatMessageBelongsToResolver is not a function.");
    }

    try {
      // @ts-expect-error - Testing for error
      await chatMessageBelongsToResolver(parent, {}, {});
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(CHAT_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(CHAT_NOT_FOUND_ERROR.MESSAGE);
    }
  });
});
