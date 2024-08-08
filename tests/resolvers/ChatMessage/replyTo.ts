import "dotenv/config";
import { replyTo as replyToResolver } from "../../../src/resolvers/ChatMessage/replyTo";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { ChatMessage } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type { TestChatMessageType } from "../../helpers/chat";
import { createTestChatMessage } from "../../helpers/chat";
import { Types } from "mongoose";
import { MESSAGE_NOT_FOUND_ERROR } from "../../../src/constants";

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

    if (typeof replyToResolver !== "function") {
      throw new Error("replyToResolver is not a function.");
    }

    const replyToPayload = await replyToResolver(parent, {}, {});

    const replyTo = await ChatMessage.findOne({
      _id: testChatMessage?.replyTo,
    }).lean();

    expect(replyToPayload).toEqual(replyTo);
  });
  it(`throws NotFoundError if no directChat exists`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);

    const parent = {
      ...testChatMessage?.toObject(),
      replyTo: new Types.ObjectId(), // Set to a non-existing ObjectId
    };

    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    if (typeof replyToResolver !== "function") {
      throw new Error("replyToResolver is not a function.");
    }

    try {
      // @ts-expect-error - Testing for error
      await replyToResolver(parent, {}, {});
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(MESSAGE_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(MESSAGE_NOT_FOUND_ERROR.MESSAGE);
    }
  });
});
