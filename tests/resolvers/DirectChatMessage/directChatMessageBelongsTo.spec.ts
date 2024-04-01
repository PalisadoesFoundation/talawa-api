import "dotenv/config";
import { directChatMessageBelongsTo as directChatMessageBelongsToResolver } from "../../../src/resolvers/DirectChatMessage/directChatMessageBelongsTo";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { DirectChat } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type { TestDirectChatMessageType } from "../../helpers/directChat";
import { createTestDirectChatMessage } from "../../helpers/directChat";
import { Types } from "mongoose";
import { CHAT_NOT_FOUND_ERROR } from "../../../src/constants";

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

    if (typeof directChatMessageBelongsToResolver !== "function") {
      throw new Error("directChatMessageBelongsToResolver is not a function.");
    }

    const directChatMessageBelongsToPayload =
      await directChatMessageBelongsToResolver(parent, {}, {});

    const directChatMessageBelongsTo = await DirectChat.findOne({
      _id: testDirectChatMessage?.directChatMessageBelongsTo,
    }).lean();

    expect(directChatMessageBelongsToPayload).toEqual(
      directChatMessageBelongsTo,
    );
  });
  it(`throws NotFoundError if no directChat exists`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);

    const parent = {
      ...testDirectChatMessage?.toObject(),
      directChatMessageBelongsTo: new Types.ObjectId(), // Set to a non-existing ObjectId
    };

    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    if (typeof directChatMessageBelongsToResolver !== "function") {
      throw new Error("directChatMessageBelongsToResolver is not a function.");
    }

    try {
      // @ts-expect-error - Testing for error
      await directChatMessageBelongsToResolver(parent, {}, {});
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(CHAT_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(CHAT_NOT_FOUND_ERROR.MESSAGE);
    }
  });
});
