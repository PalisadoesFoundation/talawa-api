import "dotenv/config";
import { sender as senderResolver } from "../../../src/resolvers/GroupChatMessage/sender";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { User } from "../../../src/models";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { TestGroupChatMessageType } from "../../helpers/groupChat";
import { createTestGroupChatMessage } from "../../helpers/groupChat";
import { Types } from "mongoose";
import { USER_NOT_FOUND_ERROR } from "../../../src/constants";

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

describe("resolvers -> GroupChatMessage -> sender", () => {
  it(`returns sender object for parent.sender`, async () => {
    const parent = testGroupChatMessage?.toObject();
    if (!parent) {
      throw new Error("Parent object is undefined.");
    }
    const senderPayload = await senderResolver?.(parent, {}, {});

    const sender = await User.findOne({
      _id: testGroupChatMessage?.sender,
    }).lean();

    expect(senderPayload).toEqual(sender);
  });
  it(`throws NotFoundError if no user exists`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);

    const parent = {
      ...testGroupChatMessage?.toObject(),
      sender: new Types.ObjectId(), // Set to a non-existing ObjectId
    };

    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    try {
      if (senderResolver) {
        // @ts-expect-error - Testing for error
        await senderResolver(parent, {}, {});
      }
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
});
