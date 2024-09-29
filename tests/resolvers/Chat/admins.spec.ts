import "dotenv/config";
import { admins as adminsResolver } from "../../../src/resolvers/Chat/admins";
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
  [, , testChat] = await createTestChatMessage();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Chat -> admins", () => {
  it(`resolves the correct admin users for the given chat`, async () => {
    const parent = testChat?.toObject();
    if (!parent) {
      throw new Error("Parent object is undefined.");
    }

    if (!adminsResolver) {
      throw new Error("adminsResolver is not defined.");
    }
    const usersPayload = await adminsResolver(parent, {}, {});

    const users = await User.find({
      _id: {
        $in: testChat?.admins,
      },
    }).lean();

    expect(usersPayload).toEqual(users);
  });
});
