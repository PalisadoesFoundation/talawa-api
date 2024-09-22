import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { connect, disconnect } from "../../helpers/db";

import { groupChatById as groupChatByIdResolver } from "../../../src/resolvers/Query/groupChatById";
import { GroupChat } from "../../../src/models";
import type {
  QueryGroupChatByIdArgs,
  QueryGroupChatsByUserIdArgs,
} from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestGroupChat } from "../../helpers/groupChat";
import type { TestGroupChatType } from "../../helpers/groupChat";

let testGroupChat: TestGroupChatType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestGroupChat();
  testGroupChat = resultArray[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> directChatsById", () => {
  it(`throws NotFoundError if no directChats exists with directChats._id === args.id`, async () => {
    try {
      const args: QueryGroupChatByIdArgs = {
        id: new Types.ObjectId().toString(),
      };

      await groupChatByIdResolver?.({}, args, {});
    } catch (error: unknown) {
      expect((error as Error).message).toEqual("Chat not found");
    }
  });

  it(`returns list of all directChats with directChat.users containing the user
  with _id === args.id`, async () => {
    const args: QueryGroupChatsByUserIdArgs = {
      id: testGroupChat?._id.toString() ?? "defaultString",
    };

    const directChatsByUserIdPayload = await groupChatByIdResolver?.(
      {},
      args,
      {},
    );

    const directChatsByUserId = await GroupChat.findById(
      testGroupChat?._id,
    ).lean();
    console.log(directChatsByUserIdPayload);
    console.log(directChatsByUserId);
    expect(directChatsByUserIdPayload).toEqual(directChatsByUserId);
  });
});
