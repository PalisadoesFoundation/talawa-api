import "dotenv/config";
import { CHAT_NOT_FOUND } from "../../../src/constants";
import { directChatsMessagesByChatID as directChatsMessagesByChatIDResolver } from "../../../src/resolvers/Query/directChatsMessagesByChatID";
import { connect, disconnect } from "../../../src/db";
import { Document, Types } from "mongoose";
import {
  User,
  Organization,
  DirectChat,
  Interface_DirectChat,
  DirectChatMessage,
} from "../../../src/models";
import { nanoid } from "nanoid";
import { QueryDirectChatsMessagesByChatIdArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestUser,createTestUserAndOrganization} from "../../helpers/userAndOrg";
import { createTestDirectChatwithUsers, createDirectChatMessage} from "../../helpers/directChat";

let testDirectChats: (Interface_DirectChat &
  Document<any, any, Interface_DirectChat>)[];

beforeAll(async () => {
  await connect();

  const [testUser1, testOrganization] = await createTestUserAndOrganization();
  const testUser2 = await createTestUser();

  const testDirectChat1 = await createTestDirectChatwithUsers(testUser1._id,testOrganization._id,[testUser1._id, testUser2._id]);
  const testDirectChat2 = await createTestDirectChatwithUsers(testUser2._id,testOrganization._id,[testUser2._id]);

  testDirectChats = [testDirectChat1, testDirectChat2];
  const testDirectChatMessage = await createDirectChatMessage(testUser1._id,testUser2._id,testDirectChats[0]._id);
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Query -> directChatsMessagesByChatID", () => {
  it(`throws NotFoundError if no directChat exists with _id === args.id`, async () => {
    try {
      const args: QueryDirectChatsMessagesByChatIdArgs = {
        id: Types.ObjectId().toString(),
      };

      await directChatsMessagesByChatIDResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(CHAT_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no directChatMessages exist
   for directChat with _id === args.id`, async () => {
    try {
      const args: QueryDirectChatsMessagesByChatIdArgs = {
        id: testDirectChats[1]._id,
      };

      await directChatsMessagesByChatIDResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(CHAT_NOT_FOUND);
    }
  });

  it(`returns list of all directChatMessages found
   for directChat with _id === args.id`, async () => {
    const args: QueryDirectChatsMessagesByChatIdArgs = {
      id: testDirectChats[0]._id,
    };

    const directChatsMessagesByChatIdPayload =
      await directChatsMessagesByChatIDResolver?.({}, args, {});

    const directChatMessagesByChatId = await DirectChatMessage.find({
      directChatMessageBelongsTo: testDirectChats[0]._id,
    }).lean();

    expect(directChatsMessagesByChatIdPayload).toEqual(
      directChatMessagesByChatId
    );
  });
});
