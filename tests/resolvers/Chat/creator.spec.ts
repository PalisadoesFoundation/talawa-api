import "dotenv/config";
import { creator as creatorResolver } from "../../../src/resolvers/Chat/creator";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { User } from "../../../src/models";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { TestChatType } from "../../helpers/chat";
import { createTestChat } from "../../helpers/chat";

let testChat: TestChatType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const userOrgChat = await createTestChat();
  testChat = userOrgChat[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> DirectChat -> creator", () => {
  it(`returns user object for parent.creator`, async () => {
    const parent = testChat?.toObject();
    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    const creatorPayload = await creatorResolver?.(parent, {}, {});

    const creator = await User.findOne({
      _id: testChat?.creatorId,
    }).lean();

    expect(creatorPayload).toEqual(creator);
  });
});
