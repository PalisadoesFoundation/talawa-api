import "dotenv/config";
import { receiver as receiverResolver } from "../../../src/resolvers/DirectChatMessage/receiver";
import { connect, disconnect } from "../../../src/db";
import { User } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestDirectChat,
  testDirectChatType,
} from "../../helpers/directChat";

let testDirectChatMessage: testDirectChatType;

beforeAll(async () => {
  await connect();
  const temp = await createTestDirectChat();
  testDirectChatMessage = temp[2];
});

afterAll(async () => {
  await disconnect();
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
