import "dotenv/config";
import { creator as creatorResolver } from "../../../src/resolvers/GroupChat/creator";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import type { InterfaceGroupChat } from "../../../src/models";
import { User } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestGroupChatType } from "../../helpers/groupChat";
import { createTestGroupChat } from "../../helpers/groupChat";

let testGroupChat: TestGroupChatType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestGroupChat();
  testGroupChat = resultArray[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> GroupChat -> creator", () => {
  it(`returns user object for parent.creator`, async () => {
    const parent = testGroupChat?.toObject();

    const creatorPayload = await creatorResolver?.(
      parent ?? ({} as InterfaceGroupChat),
      {},
      {}
    );

    const creator = await User.findOne({
      _id: testGroupChat?.creatorId,
    }).lean();

    expect(creatorPayload).toEqual(creator);
  });
});
