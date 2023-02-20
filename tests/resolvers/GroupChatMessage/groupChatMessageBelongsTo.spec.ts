import "dotenv/config";
import { groupChatMessageBelongsTo as groupChatMessageBelongsToResolver } from "../../../src/resolvers/GroupChatMessage/groupChatMessageBelongsTo";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import { GroupChat } from "../../../src/models";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createTestGroupChatMessage,
  testGroupChatMessageType,
} from "../../helpers/groupChat";

let testGroupChatMessage: testGroupChatMessageType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  const resultArray = await createTestGroupChatMessage();
  testGroupChatMessage = resultArray[3];
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
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
