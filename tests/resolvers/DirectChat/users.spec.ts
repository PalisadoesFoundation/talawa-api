import "dotenv/config";
import { users as usersResolver } from "../../../src/resolvers/DirectChat/users";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { User } from "../../../src/models";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createTestDirectChatMessage,
  testDirectChatType,
} from "../../helpers/directChat";

let testDirectChat: testDirectChatType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const userOrgChat = await createTestDirectChatMessage();
  testDirectChat = userOrgChat[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> DirectChat -> users", () => {
  it(`returns user object for parent.users`, async () => {
    const parent = testDirectChat!.toObject();

    const usersPayload = await usersResolver?.(parent, {}, {});

    const users = await User.find({
      _id: {
        $in: testDirectChat!.users,
      },
    }).lean();

    expect(usersPayload).toEqual(users);
  });
});
