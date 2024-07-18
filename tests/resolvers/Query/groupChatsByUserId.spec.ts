import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { connect, disconnect } from "../../helpers/db";

import { groupChatsByUserId as groupChatsByUserIdResolver } from "../../../src/resolvers/Query/groupChatsByUserId";
import { DirectChat } from "../../../src/models";
import type { QueryGroupChatsByUserIdArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestGroupChat } from "../../helpers/groupChat";
import type { TestUserType } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestGroupChat();
  testUser = resultArray[0];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> directChatsByUserID", () => {
  it(`throws NotFoundError if no directChats exists with directChats.users
  containing user with _id === args.id`, async () => {
    try {
      const args: QueryGroupChatsByUserIdArgs = {
        id: new Types.ObjectId().toString(),
      };

      await groupChatsByUserIdResolver?.({}, args, {});
    } catch (error: unknown) {
      expect((error as Error).message).toEqual("GroupChats not found");
    }
  });

  it(`returns list of all directChats with directChat.users containing the user
  with _id === args.id`, async () => {
    const args: QueryGroupChatsByUserIdArgs = {
      id: testUser?._id,
    };

    const groupChatsByUserIdPayload = await groupChatsByUserIdResolver?.(
      {},
      args,
      {},
    );

    const groupChatsByUserId = await DirectChat.find({
      users: testUser?._id,
    }).lean();

    expect(groupChatsByUserIdPayload).toEqual(groupChatsByUserId);
  });
});
