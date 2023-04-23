import "dotenv/config";
import { directChatMessageBelongsTo as directChatMessageBelongsToResolver } from "../../../src/resolvers/DirectChatMessage/directChatMessageBelongsTo";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { DirectChat } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestDirectChatMessage,
  TestDirectChatMessageType,
} from "../../helpers/directChat";

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
    const parent = testDirectChatMessage!.toObject();

    const directChatMessageBelongsToPayload =
      await directChatMessageBelongsToResolver?.(parent, {}, {});

    const directChatMessageBelongsTo = await DirectChat.findOne({
      _id: testDirectChatMessage?.directChatMessageBelongsTo,
    }).lean();

    expect(directChatMessageBelongsToPayload).toEqual(
      directChatMessageBelongsTo
    );
  });
});
