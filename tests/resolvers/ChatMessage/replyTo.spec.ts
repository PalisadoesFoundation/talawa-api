import "dotenv/config";
import { replyTo as replyToResolver } from "../../../src/resolvers/ChatMessage/replyTo";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { ChatMessage } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type { TestChatMessageType } from "../../helpers/chat";
import {
  createTestChatMessageWithoutReply,
  createTestChatMessage,
} from "../../helpers/chat";
import { Types } from "mongoose";
import { MESSAGE_NOT_FOUND_ERROR } from "../../../src/constants";

let testChatMessage: TestChatMessageType;
let testChatMessageWithoutReply: TestChatMessageType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  try {
    MONGOOSE_INSTANCE = await connect();
  } catch (error) {
    console.error("Failed to connect to the database", error);
    throw error;
  }

  try {
    const temp1 = await createTestChatMessage();
    testChatMessage = temp1[3];
  } catch (error) {
    console.error("Failed to create test chat message", error);
    throw error;
  }

  try {
    const temp = await createTestChatMessageWithoutReply();
    testChatMessageWithoutReply = temp[3];
  } catch (error) {
    console.error("Failed to create test chat message without reply", error);
    throw error;
  }
});

afterAll(async () => {
  if (MONGOOSE_INSTANCE) {
    await disconnect(MONGOOSE_INSTANCE);
  }
});

describe("resolvers -> DirectChatMessage -> replyTo", () => {
  it(`returns directChat object for parent.replyTo`, async () => {
    const parent = testChatMessage ? testChatMessage.toObject() : null;

    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    if (typeof replyToResolver !== "function") {
      throw new Error("replyToResolver is not a function.");
    }

    try {
      const replyToPayload = await replyToResolver(parent, {}, {});
      const replyTo = await ChatMessage.findOne({
        _id: testChatMessage?.replyTo,
      }).lean();
      expect(replyToPayload).toEqual(replyTo);
    } catch (error) {
      console.error("Test failed", error);
      throw error;
    }
  });
  it(`throws NotFoundError if no directChat exists`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message: string) => message);

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
    } finally {
      spy.mockRestore(); // Restore the original function
    }
  });
  it(`return null if no replyTo`, async () => {
    const parent = testChatMessageWithoutReply?.toObject();

    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    if (typeof replyToResolver !== "function") {
      throw new Error("replyToResolver is not a function.");
    }

    const replyToPayload = await replyToResolver(parent, {}, {});

    const replyTo = null;

    expect(replyToPayload).toEqual(replyTo);
  });
});
