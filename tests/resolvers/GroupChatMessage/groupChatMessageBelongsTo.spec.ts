import "dotenv/config";
import { groupChatMessageBelongsTo as groupChatMessageBelongsToResolver } from "../../../src/resolvers/GroupChatMessage/groupChatMessageBelongsTo";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { GroupChat } from "../../../src/models";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { TestGroupChatMessageType } from "../../helpers/groupChat";
import { createTestGroupChatMessage } from "../../helpers/groupChat";
import { CHAT_NOT_FOUND_ERROR } from "../../../src/constants";

let testGroupChatMessage: TestGroupChatMessageType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestGroupChatMessage();
  testGroupChatMessage = resultArray[3];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> GroupChatMessage -> groupChatMessageBelongsTo", () => {
  it(`returns groupChatMessageBelongsTo object for parent.groupChatMessageBelongsTo`, async () => {
    const parent = testGroupChatMessage?.toObject();
    if (!parent) {
      throw new Error("Parent object is undefined.");
    }
    const groupChatMessageBelongsToPayload =
      await groupChatMessageBelongsToResolver?.(parent, {}, {});

    const groupChatMessageBelongsTo = await GroupChat.findOne({
      _id: testGroupChatMessage?.groupChatMessageBelongsTo,
    }).lean();

    expect(groupChatMessageBelongsToPayload).toEqual(groupChatMessageBelongsTo);
  });
  it(`throws NotFoundError if no groupChatMessageBelongsTo exists`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);

    const parent = {
      ...testGroupChatMessage?.toObject(),
      groupChatMessageBelongsTo: new Types.ObjectId(), // Set to a non-existing ObjectId
    };

    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    try {
      if (groupChatMessageBelongsToResolver) {
        // @ts-expect-error - Testing for error
        await groupChatMessageBelongsToResolver(parent, {}, {});
      }
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(CHAT_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(CHAT_NOT_FOUND_ERROR.MESSAGE);
    }
  });
});
