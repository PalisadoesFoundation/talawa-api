import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { connect, disconnect } from "../../helpers/db";

import { directChatsByUserID as directChatsByUserIDResolver } from "../../../src/resolvers/Query/directChatsByUserID";
import { DirectChat } from "../../../src/models";
import type { QueryDirectChatsByUserIdArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestDirectChat } from "../../helpers/directChat";
import type { TestUserType } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestDirectChat();
  testUser = resultArray[0];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> directChatsByUserID", () => {
  it(`throws NotFoundError if no directChats exists with directChats.users
  containing user with _id === args.id`, async () => {
    try {
      const args: QueryDirectChatsByUserIdArgs = {
        id: new Types.ObjectId().toString(),
      };

      await directChatsByUserIDResolver?.({}, args, {});
    } catch (error: unknown) {
      expect((error as Error).message).toEqual("DirectChats not found");
    }
  });

  it(`returns list of all directChats with directChat.users containing the user
  with _id === args.id`, async () => {
    const args: QueryDirectChatsByUserIdArgs = {
      id: testUser?._id,
    };

    const directChatsByUserIdPayload = await directChatsByUserIDResolver?.(
      {},
      args,
      {},
    );

    const directChatsByUserId = await DirectChat.find({
      users: testUser?._id,
    }).lean();

    expect(directChatsByUserIdPayload).toEqual(directChatsByUserId);
  });
});
