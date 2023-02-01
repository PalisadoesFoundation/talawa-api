import "dotenv/config";
import { directChatMessageBelongsTo as directChatMessageBelongsToResolver } from "../../../src/resolvers/DirectChatMessage/directChatMessageBelongsTo";
import { connect, disconnect } from "../../../src/db";
import { DirectChat } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestDirectChat,
  testDirectChatType,
} from "../../helpers/directChatMessage";

let testDirectChatMessage: testDirectChatType;

beforeAll(async () => {
  await connect();
  const temp = await createTestDirectChat();
  testDirectChatMessage = temp[2];
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> DirectChatMessage -> directChatMessageBelongsTo", () => {
  it(`returns directChat object for parent.directChatMessageBelongsTo`, async () => {
    const parent = testDirectChatMessage!.toObject();

    const directChatMessageBelongsToPayload =
      await directChatMessageBelongsToResolver?.(parent, {}, {});

    const directChatMessageBelongsTo = await DirectChat.findOne({
      _id: testDirectChatMessage!.directChatMessageBelongsTo,
    }).lean();

    expect(directChatMessageBelongsToPayload).toEqual(
      directChatMessageBelongsTo
    );
  });
});
