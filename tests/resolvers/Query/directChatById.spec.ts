import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { connect, disconnect } from "../../helpers/db";

import { directChatById as directChatByIdResolver } from "../../../src/resolvers/Query/directChatById";
import { DirectChat } from "../../../src/models";
import type { QueryDirectChatsByUserIdArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestDirectChat } from "../../helpers/directChat";
import type { TestDirectChatType } from "../../helpers/directChat";

let testDirectChat: TestDirectChatType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultArray = await createTestDirectChat();
  testDirectChat = resultArray[2];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> directChatsById", () => {
  it(`throws NotFoundError if no directChats exists with directChats._id === args.id`, async () => {
    try {
      const args: QueryDirectChatsByUserIdArgs = {
        id: new Types.ObjectId().toString(),
      };

      await directChatByIdResolver?.({}, args, {});
    } catch (error: unknown) {
      expect((error as Error).message).toEqual("Chat not found");
    }
  });

  it(`returns list of all directChats with directChat.users containing the user
  with _id === args.id`, async () => {
    const args: QueryDirectChatsByUserIdArgs = {
      id: testDirectChat?._id.toString() ?? "defaultString",
    };

    const directChatsByUserIdPayload = await directChatByIdResolver?.(
      {},
      args,
      {},
    );

    const directChatsByUserId = await DirectChat.findById(
      testDirectChat?._id,
    ).lean();
    console.log(directChatsByUserIdPayload);
    console.log(directChatsByUserId);
    expect(directChatsByUserIdPayload).toEqual(directChatsByUserId);
  });
});
