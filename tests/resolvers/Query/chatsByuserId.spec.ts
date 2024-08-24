import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { connect, disconnect } from "../../helpers/db";

import { chatsByUserId as chatsByUserIdResolver } from "../../../src/resolvers/Query/chatsByUserId";
import { Chat } from "../../../src/models";
import type { QueryDirectChatsByUserIdArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestChat } from "../../helpers/chat";
import type { TestUserType } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestChat();
  testUser = resultArray[0];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> chatsByUserId", () => {
  it(`throws NotFoundError if no directChats exists with directChats.users
  containing user with _id === args.id`, async () => {
    try {
      const args: QueryDirectChatsByUserIdArgs = {
        id: new Types.ObjectId().toString(),
      };

      await chatsByUserIdResolver?.({}, args, {});
    } catch (error: unknown) {
      expect((error as Error).message).toEqual("DirectChats not found");
    }
  });

  it(`returns list of all directChats with directChat.users containing the user
  with _id === args.id`, async () => {
    const args: QueryDirectChatsByUserIdArgs = {
      id: testUser?._id,
    };

    const chatsByUserIdPayload = await chatsByUserIdResolver?.(
      {},
      args,
      {},
    );

    const chatsByUserId = await Chat.find({
      users: testUser?._id,
    }).lean();

    expect(chatsByUserIdPayload).toEqual(chatsByUserId);
  });
});