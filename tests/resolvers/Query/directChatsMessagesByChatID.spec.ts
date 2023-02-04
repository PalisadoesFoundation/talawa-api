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

let testDirectChats: (Interface_DirectChat &
  Document<any, any, Interface_DirectChat>)[];

beforeAll(async () => {
  await connect("TALAWA_TESING_DB");

  const testUsers = await User.insertMany([
    {
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: "password",
      firstName: "firstName",
      lastName: "lastName",
      appLanguageCode: "en",
    },
    {
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: "password",
      firstName: "firstName",
      lastName: "lastName",
      appLanguageCode: "en",
    },
  ]);

  const testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUsers[0]._id,
    admins: [testUsers[0]._id],
    members: [testUsers[0]._id],
  });

  await User.updateOne(
    {
      _id: testUsers[0]._id,
    },
    {
      $set: {
        createdOrganizations: [testOrganization._id],
        adminFor: [testOrganization._id],
        joinedOrganizations: [testOrganization._id],
      },
    }
  );

  testDirectChats = await DirectChat.insertMany([
    {
      creator: testUsers[0]._id,
      organization: testOrganization._id,
      users: [testUsers[0]._id, testUsers[1]._id],
    },
    {
      creator: testUsers[1]._id,
      organization: testOrganization._id,
      users: [testUsers[1]._id],
    },
  ]);

  await DirectChatMessage.create({
    directChatMessageBelongsTo: testDirectChats[0]._id,
    sender: testUsers[0]._id,
    receiver: testUsers[1]._id,
    createdAt: new Date(),
    messageContent: "messageContent",
  });
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
