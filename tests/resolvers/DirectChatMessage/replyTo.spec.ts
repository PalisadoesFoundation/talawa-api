import "dotenv/config";
import { replyTo as replyToResolver } from "../../../src/resolvers/DirectChatMessage/replyTo";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { DirectChatMessage } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type { TestDirectChatMessageType } from "../../helpers/directChat";
import { createTestDirectChatMessage } from "../../helpers/directChat";
import { Types } from "mongoose";
import { MESSAGE_NOT_FOUND_ERROR } from "../../../src/constants";

let testDirectChatMessage: TestDirectChatMessageType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestDirectChatMessage();
  testDirectChatMessage = temp[3];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> DirectChatMessage -> directChatMessageBelongsTo", () => {
  it(`returns directChat object for parent.directChatMessageBelongsTo`, async () => {
    const parent = testDirectChatMessage?.toObject();

    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    if (typeof replyToResolver !== "function") {
      throw new Error("replyToResolver is not a function.");
    }

    const replyToPayload = await replyToResolver(parent, {}, {});

    const replyTo = await DirectChatMessage.findOne({
      _id: testDirectChatMessage?.replyTo,
    }).lean();

    expect(replyToPayload).toEqual(replyTo);
  });
  it(`throws NotFoundError if no message exists`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);

    const parent = {
      ...testDirectChatMessage?.toObject(),
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

  it(`return null if there is no replyTo message`, async () => {
    const parent = {
      ...testDirectChatMessage?.toObject(),
      replyTo: "", // Set to a non-existing ObjectId
    };

    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    if (typeof replyToResolver !== "function") {
      throw new Error("replyToResolver is not a function.");
    }

    // @ts-expect-error - Testing for error
    const replyToPayload = await replyToResolver(parent, {}, {});
    expect(replyToPayload).toEqual(null);
  });
});
