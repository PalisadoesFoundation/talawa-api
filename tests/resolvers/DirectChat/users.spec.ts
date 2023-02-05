import "dotenv/config";
import { users as usersResolver } from "../../../src/resolvers/DirectChat/users";
import { connect, disconnect } from "../../../src/db";
import { User } from "../../../src/models";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createTestDirectChatMessage,
  testDirectChatType,
} from "../../helpers/directChat";

let testDirectChat: testDirectChatType;

beforeAll(async () => {
  await connect("TALAWA_TESTING_DB");
  const userOrgChat = await createTestDirectChatMessage();
  testDirectChat = userOrgChat[2];
});

afterAll(async () => {
  await disconnect();
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
