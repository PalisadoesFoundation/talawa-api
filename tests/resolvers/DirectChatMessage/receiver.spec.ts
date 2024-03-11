import "dotenv/config";
import { receiver as receiverResolver } from "../../../src/resolvers/DirectChatMessage/receiver";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { User } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type { TestDirectChatMessageType } from "../../helpers/directChat";
import { createTestDirectChatMessage } from "../../helpers/directChat";
import { Types } from "mongoose";
import { USER_NOT_FOUND_ERROR } from "../../../src/constants";

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

describe("resolvers -> DirectChatMessage -> receiver", () => {
  it(`returns user object for parent.receiver`, async () => {
    const parent = testDirectChatMessage?.toObject();
    if (!parent) {
      throw new Error("Parent object is undefined.");
    }
    const receiverPayload = await receiverResolver?.(parent, {}, {});

    const receiver = await User.findOne({
      _id: testDirectChatMessage?.receiver,
    }).lean();

    expect(receiverPayload).toEqual(receiver);
  });
  it(`throws NotFoundError if no user exists`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);

    const parent = {
      ...testDirectChatMessage?.toObject(),
      receiver: new Types.ObjectId(), // Set to a non-existing ObjectId
    };

    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    try {
      if (receiverResolver) {
        // @ts-expect-error - Testing for error
        await receiverResolver(parent, {}, {});
      }
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
});
