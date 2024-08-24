import "dotenv/config";
import { replyTo as replyToResolver } from "../../../src/resolvers/GroupChatMessage/replyTo";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { GroupChatMessage } from "../../../src/models";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { TestGroupChatMessageType } from "../../helpers/groupChat";
import { createTestGroupChatMessage } from "../../helpers/groupChat";
import { MESSAGE_NOT_FOUND_ERROR } from "../../../src/constants";

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

describe("resolvers -> GroupChatMessage -> replyTo", () => {
  it(`returns groupChatMessageBelongsTo object for parent.groupChatMessageBelongsTo`, async () => {
    const parent = testGroupChatMessage?.toObject();
    if (!parent) {
      throw new Error("Parent object is undefined.");
    }
    const replyToPayload = await replyToResolver?.(parent, {}, {});

    const replyTo = await GroupChatMessage.findOne({
      _id: testGroupChatMessage?.replyTo,
    }).lean();

    expect(replyToPayload).toEqual(replyTo);
  });
  it(`throws NotFoundError if replyTo message not found`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);

    const parent = {
      ...testGroupChatMessage?.toObject(),
      replyTo: new Types.ObjectId().toString(), // Set to a non-existing ObjectId
    };

    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    try {
      if (replyToResolver) {
        // @ts-expect-error - Testing for error
        await replyToResolver(parent, {}, {});
      }
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(MESSAGE_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(MESSAGE_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`return null if there no reply to message`, async () => {
    const parent = {
      ...testGroupChatMessage?.toObject(),
      replyTo: "",
    };

    console;

    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    if (replyToResolver) {
      // @ts-expect-error - Testing for error
      const replyToPayload = await replyToResolver(parent, {}, {});
      expect(replyToPayload).toEqual(null);
    }
  });
});
