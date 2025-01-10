import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { connect, disconnect } from "../../helpers/db";

import { getGroupChatsByUserId as getGroupChatsByUserIdResolver } from "../../../src/resolvers/Query/getGroupChatsByUserId";
import { Chat } from "../../../src/models";
import type { QueryChatsByUserIdArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestChat,
  createTestGroupChatWithoutImage,
} from "../../helpers/chat";
import type { TestUserType } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testUser1: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestChat();

  [testUser1, ,] = await createTestGroupChatWithoutImage();

  testUser = resultArray[0];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> getGroupChatsByUserId", () => {
  it(`throws NotFoundError if no Chats exists with chats.users
  containing user with _id === args.id`, async () => {
    try {
      const args: QueryChatsByUserIdArgs = {
        id: new Types.ObjectId().toString(),
      };

      await getGroupChatsByUserIdResolver?.({}, args, {});
    } catch (error: unknown) {
      expect((error as Error).message).toEqual("Chats not found");
    }
  });

  it(`returns list of group chats`, async () => {
    const args: QueryChatsByUserIdArgs = {
      id: testUser?._id,
    };

    const chatsByUserIdPayload = await getGroupChatsByUserIdResolver?.(
      {},
      args,
      { userId: testUser?._id, apiRootUrl: "" },
    );

    const chatsByUserId = await Chat.find({
      users: testUser?._id,
    }).lean();

    const filteredChats = chatsByUserId.filter((chat) => {
      const unseenMessages = JSON.parse(
        chat.unseenMessagesByUsers as unknown as string,
      );
      return unseenMessages[testUser?._id] > 0;
    });

    expect(chatsByUserIdPayload).toEqual(filteredChats);
  });

  it(`returns list of group chat without image`, async () => {
    const args: QueryChatsByUserIdArgs = {
      id: testUser1?._id,
    };

    const chatsByUserIdPayload = await getGroupChatsByUserIdResolver?.(
      {},
      args,
      { userId: testUser1?._id, apiRootUrl: "" },
    );

    const chatsByUserId = await Chat.find({
      users: testUser1?._id,
    }).lean();

    const filteredChats = chatsByUserId.filter((chat) => {
      const unseenMessages = JSON.parse(
        chat.unseenMessagesByUsers as unknown as string,
      );
      return unseenMessages[testUser1?._id] > 0;
    });

    expect(chatsByUserIdPayload).toEqual(filteredChats);
  });
});
