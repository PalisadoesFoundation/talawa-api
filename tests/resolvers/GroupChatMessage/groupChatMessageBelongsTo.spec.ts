import "dotenv/config";
import { groupChatMessageBelongsTo as groupChatMessageBelongsToResolver } from "../../../src/resolvers/GroupChatMessage/groupChatMessageBelongsTo";
import { connect, disconnect } from "../../../src/db";
import { GroupChat } from "../../../src/models";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createTestGroupChatMessage,
  testGroupChatMessageType,
} from "../../helpers/groupChat";

let testGroupChatMessage: testGroupChatMessageType;

beforeAll(async () => {
  await connect("TALAWA_TESING_DB");
  const resultArray = await createTestGroupChatMessage();
  testGroupChatMessage = resultArray[3];
});

afterAll(async () => {
  await disconnect();
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
