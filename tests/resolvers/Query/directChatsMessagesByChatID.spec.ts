import "dotenv/config";
import { CHAT_NOT_FOUND_ERROR } from "../../../src/constants";
import { directChatsMessagesByChatID as directChatsMessagesByChatIDResolver } from "../../../src/resolvers/Query/directChatsMessagesByChatID";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { Types } from "mongoose";
import { DirectChatMessage } from "../../../src/models";
import { QueryDirectChatsMessagesByChatIdArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestUser,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";
import {
  createTestDirectChatwithUsers,
  createDirectChatMessage,
  TestDirectChatType,
} from "../../helpers/directChat";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testDirectChats: TestDirectChatType[];

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  const [testUser1, testOrganization] = await createTestUserAndOrganization();
  const testUser2 = await createTestUser();

  const testDirectChat1 = await createTestDirectChatwithUsers(
    testUser1?._id,
    testOrganization?._id,
    [testUser1?._id, testUser2?._id]
  );
  const testDirectChat2 = await createTestDirectChatwithUsers(
    testUser2?._id,
    testOrganization?._id,
    [testUser2?._id]
  );

  testDirectChats = [testDirectChat1, testDirectChat2];
  await createDirectChatMessage(
    testUser1?._id,
    testUser2?._id,
    testDirectChats[0]?._id
  );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Query -> directChatsMessagesByChatID", () => {
  it(`throws NotFoundError if no directChat exists with _id === args.id`, async () => {
    try {
      const args: QueryDirectChatsMessagesByChatIdArgs = {
        id: Types.ObjectId().toString(),
      };

      await directChatsMessagesByChatIDResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(CHAT_NOT_FOUND_ERROR.DESC);
    }
  });

  it(`throws NotFoundError if no directChatMessages exist
   for directChat with _id === args.id`, async () => {
    try {
      const args: QueryDirectChatsMessagesByChatIdArgs = {
        id: testDirectChats[1]?._id,
      };

      await directChatsMessagesByChatIDResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(CHAT_NOT_FOUND_ERROR.DESC);
    }
  });

  it(`returns list of all directChatMessages found
   for directChat with _id === args.id`, async () => {
    const args: QueryDirectChatsMessagesByChatIdArgs = {
      id: testDirectChats[0]?._id,
    };

    const directChatsMessagesByChatIdPayload =
      await directChatsMessagesByChatIDResolver?.({}, args, {});

    const directChatMessagesByChatId = await DirectChatMessage.find({
      directChatMessageBelongsTo: testDirectChats[0]?._id,
    }).lean();

    expect(directChatsMessagesByChatIdPayload).toEqual(
      directChatMessagesByChatId
    );
  });
});
