import "dotenv/config";
import { users as usersResolver } from "../../../src/resolvers/Chat/users";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { User } from "../../../src/models";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { TestChatType } from "../../helpers/chat";
import { createTestChatMessage } from "../../helpers/chat";

let testChat: TestChatType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const userOrgChat = await createTestChatMessage();
  testChat = userOrgChat[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Chat -> users", () => {
  it(`returns user object for parent.users`, async () => {
    const parent = testChat?.toObject();
    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    const usersPayload = await usersResolver?.(parent, {}, {});

    const users = await User.find({
      _id: {
        $in: testChat?.users,
      },
    }).lean();

    expect(usersPayload).toEqual(users);
  });
});
