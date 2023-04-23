import "dotenv/config";
import { groupChatMessageBelongsTo as groupChatMessageBelongsToResolver } from "../../../src/resolvers/GroupChatMessage/groupChatMessageBelongsTo";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { GroupChat } from "../../../src/models";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { TestGroupChatMessageType } from "../../helpers/groupChat";
import { createTestGroupChatMessage } from "../../helpers/groupChat";

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
    const parent = testGroupChatMessage!.toObject();

    const groupChatMessageBelongsToPayload =
      await groupChatMessageBelongsToResolver?.(parent, {}, {});

    const groupChatMessageBelongsTo = await GroupChat.findOne({
      _id: testGroupChatMessage!.groupChatMessageBelongsTo,
    }).lean();

    expect(groupChatMessageBelongsToPayload).toEqual(groupChatMessageBelongsTo);
  });
});
