import "dotenv/config";
import { sender as senderResolver } from "../../../src/resolvers/GroupChatMessage/sender";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { User } from "../../../src/models";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createTestGroupChatMessage,
  testGroupChatMessageType,
} from "../../helpers/groupChat";

let testGroupChatMessage: testGroupChatMessageType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestGroupChatMessage();
  testGroupChatMessage = resultArray[3];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> GroupChatMessage -> sender", () => {
  it(`returns sender object for parent.sender`, async () => {
    const parent = testGroupChatMessage!.toObject();

    const senderPayload = await senderResolver?.(parent, {}, {});

    const sender = await User.findOne({
      _id: testGroupChatMessage!.sender,
    }).lean();

    expect(senderPayload).toEqual(sender);
  });
});
