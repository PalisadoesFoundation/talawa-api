import "dotenv/config";
import { receiver as receiverResolver } from "../../../src/resolvers/DirectChatMessage/receiver";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import { User } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestDirectChatMessage,
  TestDirectChatMessageType,
} from "../../helpers/directChat";

let testDirectChatMessage: TestDirectChatMessageType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  const temp = await createTestDirectChatMessage();
  testDirectChatMessage = temp[3];
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> DirectChatMessage -> receiver", () => {
  it(`returns user object for parent.receiver`, async () => {
    const parent = testDirectChatMessage!.toObject();

    const receiverPayload = await receiverResolver?.(parent, {}, {});

    const receiver = await User.findOne({
      _id: testDirectChatMessage!.receiver,
    }).lean();

    expect(receiverPayload).toEqual(receiver);
  });
});
