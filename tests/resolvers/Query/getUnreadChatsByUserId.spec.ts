import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { connect, disconnect } from "../../helpers/db";

import { getUnreadChatsByUserId as getUnreadChatsByUserIdResolver } from "../../../src/resolvers/Query/getUnreadChatsByUserId";
import { Chat } from "../../../src/models";
import type { QueryChatsByUserIdArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestChat, createTestDirectChat } from "../../helpers/chat";
import type { TestUserType } from "../../helpers/userAndOrg";

let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testUser1: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestChat();
  [testUser1, ,] = await createTestDirectChat();

  testUser = resultArray[0];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> getUnreadChatsByUserId", () => {
  it(`throws NotFoundError if no Chats exists with chats.users
  containing user with _id === args.id`, async () => {
    try {
      const args: QueryChatsByUserIdArgs = {
        id: new Types.ObjectId().toString(),
      };

      await getUnreadChatsByUserIdResolver?.({}, args, {});
    } catch (error: unknown) {
      expect((error as Error).message).toEqual("Chats not found");
    }
  });

  it(`returns list of chats with unread messages`, async () => {
    const args: QueryChatsByUserIdArgs = {
      id: testUser?._id,
    };

    const chatsByUserIdPayload = await getUnreadChatsByUserIdResolver?.(
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

  it(`returns list of direct chats with unread messages`, async () => {
    const args: QueryChatsByUserIdArgs = {
      id: testUser?._id,
    };

    const chatsByUserIdPayload = await getUnreadChatsByUserIdResolver?.(
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
