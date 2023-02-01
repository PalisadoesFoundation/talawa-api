import "dotenv/config";
import { creator as creatorResolver } from "../../../src/resolvers/DirectChat/creator";
import { connect, disconnect } from "../../../src/db";
import { User } from "../../../src/models";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createTestDirectChat,
  testDirectChatType,
} from "../../helpers/directChat";

let testDirectChat: testDirectChatType;

beforeAll(async () => {
  await connect();
  const userOrgChat = await createTestDirectChat();
  testDirectChat = userOrgChat[2];
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> DirectChat -> creator", () => {
  it(`returns user object for parent.creator`, async () => {
    const parent = testDirectChat!.toObject();

    const creatorPayload = await creatorResolver?.(parent, {}, {});

    const creator = await User.findOne({
      _id: testDirectChat!.creator,
    }).lean();

    expect(creatorPayload).toEqual(creator);
  });
});
