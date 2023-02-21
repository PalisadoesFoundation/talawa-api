import "dotenv/config";
import { directChats as directChatsResolver } from "../../../src/resolvers/Query/directChats";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { DirectChat } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestUser,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";
import { createTestDirectMessageForMultipleUser } from "../../helpers/directChat";

let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  const [testUser1, testOrganization] = await createTestUserAndOrganization();
  const testUser2 = await createTestUser();
  await createTestDirectMessageForMultipleUser(
    testUser1?._id,
    testUser2?._id,
    testOrganization?._id
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Query -> directChats", () => {
  it(`returns list of all existing directChats`, async () => {
    const directChatsPayload = await directChatsResolver?.({}, {}, {});

    const directChats = await DirectChat.find().lean();

    expect(directChatsPayload).toEqual(directChats);
  });
});
